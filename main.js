const axios = require("axios");

// CLI commands
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

                // Create a CUSTOM GENERATOR to list vegan foods
                function* list_vegan_foods() {
                    try {
                        // Filter Vegan Food
                        const veganOnly = data.filter((meal) => meal.dietary_preferences.includes("vegan")
                        );

                        let idx = 0;

                        while (veganOnly[idx]) {
                            yield veganOnly[idx];
                            idx++;
                        }

                    } catch (error) {
                        console.log('Something went wrong while listing vegan items', {
                            error,
                        });
                    }
                }

                // Create a Vegan CUSTOM ITERABLE Object
                // const vIter = {
                //     // We need to implement a Symbol.iterator method
                //     [Symbol.iterator]() {
                //         return {
                //             [Symbol.iterator]() {
                //                 return this;
                //             },

                //             // Also implement the next method
                //             next() {
                //                 const current = veganOnly[idx];
                //                 idx++;

                //                 // Return an object containing the value and done property
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
                // Request the Food Data (buil-in array)
                const { data } = await axios.get("http://localhost:3001/food");

                // Use Symbol.iterator to traverse the array
                const it = data[Symbol.iterator]();

                let actionIt;

                // CUSTOM ITERATOR over action functions
                // const actionIterator = {
                //     [Symbol.iterator]() {
                //         let positions = [...this.actions];

                //         return {
                //             [Symbol.iterator]() {
                //                 return this;
                //             },

                //             // Iterating over functions
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

                // CUSTOM GENERATOR
                function* actionGenerator() {
                    try {
                        const food = yield;
                        const servingSize = yield queryServingSize();
                        yield displayCalories(servingSize, food);
                    } catch (error) {
                        console.log({ error });
                    }
                }

                // Action Functions
                function queryServingSize(food) {
                    readline.question(
                        `How many servings (in decimal value) did you eat? \nInput "nevermind or n" if you would like to exit the question : `,
                        (mealSize) => {
                            if (mealSize === 'nevermind' || mealSize === 'n') {
                                actionIt.return();
                                readline.prompt();
                            }
                            else if (typeof mealSize !== 'number' || mealSize === NaN) {
                                actionIt.throw('Please, numbers only');
                            }
                            else {
                                actionIt.next(mealSize);
                            }
                        }
                    );
                }

                async function displayCalories(mealSize, food) {
                    const calories = Number.parseFloat(food.calories * Number(mealSize));
                    console.log(`The meal ${food.name} with serving size ${mealSize} has ${calories} calories.`);

                    // Log the specific meal for each user
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
                                }
                            }
                        ]
                    }

                    // Update JSON "DB"
                    await axios.put("http://localhost:3001/users/1", putReqBody, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
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

                            // Iterating through action functions
                            // actionIt = actionIterator[Symbol.iterator]();
                            // actionIt.next(pos.value);

                            // Using a generator
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
                readline.question("Input your Email : ", async email => {

                    // Quick filter with JSON server
                    const { data } = await axios.get(`http://localhost:3001/users?email=${email}`);

                    // Data is an array of 1 element
                    const foodLog = data[0].log || [];

                    let totalCalories = 0;

                    function* getFoodLog() {
                        try {
                            yield* foodLog;
                        } catch (error) {
                            console.log('Error reading the food log', { error });
                        }
                    }

                    // Error Handling
                    const logIter = getFoodLog();

                    for (const entry of getFoodLog()) {
                        const timestamp = Object.keys(entry);

                        if (isToday(new Date(Number(timestamp)))) {
                            console.log(
                                `${entry[timestamp].food}, ${entry[timestamp].servingSize} serving(s)`,
                            );

                            totalCalories += entry[timestamp].calories;

                            if (totalCalories >= 10000) {
                                console.log('---------------');
                                console.log(`WoW! You've reached 10000 calories1`);
                                logIter.return();
                            }
                        }
                    }

                    console.log('---------------');
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
