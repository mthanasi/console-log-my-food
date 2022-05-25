const axios = require("axios");

// cli commands
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "enter command > ",
});

interface();

readline.prompt();

readline.on("line", async (line) => {
  switch (line.trim()) {
    case "list vegan foods":
      {
        const { data } = await axios.get("http://localhost:3001/food");

        // custom generator to list vegan foods
        function* list_vegan_foods() {
          try {
            // Filter Vegan Food
            const veganOnly = data.filter((meal) =>
              meal.dietary_preferences.includes("vegan")
            );

            let idx = 0;

            while (veganOnly[idx]) {
              yield veganOnly[idx];
              idx++;
            }
          } catch (error) {
            console.log("Something went wrong while listing vegan items", {
              error,
            });
          }
        }

        // vegan custom iterable obj
        // const vIter = {
        //     [Symbol.iterator]() {
        //         return {
        //             [Symbol.iterator]() {
        //                 return this;
        //             },

        //             next() {
        //                 const current = veganOnly[idx];
        //                 idx++;

        //                 if (current) {
        //                     return { value: current, done: false };
        //                 } else {
        //                     return { value: current, done: true };
        //                 }
        //             },
        //         };
        //     },
        // };

        for (let val of list_vegan_foods()) {
          console.log(val.name);
        }
        readline.prompt();
      }

      break;

    case "log":
      {
        const { data } = await axios.get("http://localhost:3001/food");

        // traversing the array through Symbol.iterator
        const it = data[Symbol.iterator]();

        let actionIt;

        // custom iterator over action functions
        // const actionIterator = {
        //     [Symbol.iterator]() {
        //         let positions = [...this.actions];

        //         return {
        //             [Symbol.iterator]() {
        //                 return this;
        //             },

        //             next(...args) {
        //                 if (positions.length > 0) {
        //                     const pos = positions.shift();
        //                     const result = pos(...args);

        //                     return { value: result, done: false };
        //                 } else {
        //                     return { done: true };
        //                 }
        //             },

        //             return() {
        //                 console.log("Exiting the question ...");
        //                 positions = [];
        //                 return { done: true };
        //             },

        //             throw(error) {
        //                 console.log(error);
        //                 return { value: undefined, done: true };
        //             }
        //         };
        //     },

        //     actions: [queryServingSize, displayCalories],
        // };

        // custom generator
        function* actionGenerator() {
          try {
            const food = yield;
            const servingSize = yield queryServingSize();
            yield displayCalories(servingSize, food);
          } catch (error) {
            console.log({ error });
          }
        }

        function queryServingSize(food) {
          readline.question(
            `How many servings (in decimal value) did you eat? \nInput "nevermind or n" if you would like to exit the question : `,
            (mealSize) => {
              if (mealSize === "nevermind" || mealSize === "n") {
                actionIt.return();
                readline.prompt();
              } else if (parseInt(mealSize) === NaN) {
                actionIt.throw("Please, numbers only");
              } else {
                actionIt.next(mealSize);
              }
            }
          );
        }

        async function displayCalories(mealSize, food) {
          const calories = Number.parseFloat(food.calories * Number(mealSize));
          console.log(
            `The meal ${food.name} with serving size ${mealSize} has ${calories} calories.`
          );

          const { data } = await axios("http://localhost:3001/users/1");

          const userLog = data.log || [];

          const putReqBody = {
            ...data,
            log: [
              ...userLog,
              {
                [Date.now()]: {
                  food: food.name,
                  servingSize: mealSize,
                  calories,
                },
              },
            ],
          };

          await axios.put("http://localhost:3001/users/1", putReqBody, {
            headers: {
              "Content-Type": "application/json",
            },
          });

          actionIt.next();
          readline.prompt();
        }

        readline.question("What would you like to log Today? \n", (item) => {
          let pos = it.next();

          while (!pos.done) {
            const food = pos.value.name;

            if (food === item) {
              console.log(
                `A single serving of ${item} has ${pos.value.calories} calories.`
              );

              // iterating through action functions
              // actionIt = actionIterator[Symbol.iterator]();
              // actionIt.next(pos.value);

              // using a generator
              actionIt = actionGenerator();

              actionIt.next();
              actionIt.next(pos.value);
            }

            pos = it.next();
          }
          readline.prompt();
        });
      }

      break;

    case "today's log":
      {
        readline.question("Input your Email : ", async (email) => {
          const { data } = await axios.get(
            `http://localhost:3001/users?email=${email}`
          );

          // data = array of 1 element
          const foodLog = data[0].log || [];

          let totalCalories = 0;

          function* getFoodLog() {
            try {
              yield* foodLog;
            } catch (error) {
              console.log("Error reading the food log", { error });
            }
          }

          // error handling
          const logIter = getFoodLog();

          for (const entry of getFoodLog()) {
            const timestamp = Object.keys(entry);

            if (isToday(new Date(Number(timestamp)))) {
              console.log(
                `${entry[timestamp].food}, ${entry[timestamp].servingSize} serving(s)`
              );

              totalCalories += entry[timestamp].calories;

              if (totalCalories >= 10000) {
                console.log("---------------");
                console.log(`WoW! You've reached 10000 calories1`);
                logIter.return();
              }
            }
          }

          console.log("---------------");
          console.log(`Total Calories: ${totalCalories}`);
          readline.prompt();
        });
      }
      break;
  }
});

function isToday(timestamp) {
  const today = new Date();
  return (
    timestamp.getDate() === today.getDate() &&
    timestamp.getMonth() === today.getMonth() &&
    timestamp.getFullYear() === today.getFullYear()
  );
}

function interface() {
  console.log("....................");
  console.log(".     COMMANDS     .");
  console.log(". log              .");
  console.log(". list vegan foods .");
  console.log(". today's log      .");
  console.log("....................\n");
}
