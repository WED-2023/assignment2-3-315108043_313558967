var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
const DButils = require("../routes/utils/DButils"); // Ensure the path is correct

router.get("/", (req, res) => res.send("im here"));

router.post("/AddNewRecipe", async (req, res, next) => {
  try {
    const username = req.session.user_id; 

    const { title, image_url, ready_in_minutes, aggregate_likes, vegetarian, vegan, gluten_free, summary, ingredients, instructions, servings } = req.body;

    if (!username || !title || !image_url || ready_in_minutes == null || aggregate_likes == null || servings == null || !summary || !ingredients || !instructions) {
      console.log("Invalid input data:", {
        username, title, image_url, ready_in_minutes, aggregate_likes, servings, summary, ingredients, instructions
      });
      return res.status(400).send({ 
        message: "The provided input data is invalid. Please check the input and try again.", 
        success: false 
      });
    }

    // Check if the recipe already exists
    const checkQuery = `SELECT * FROM MyRecipes WHERE username = '${username}' AND title = '${title}'`;
    const existingRecipes = await DButils.execQuery(checkQuery);

    if (existingRecipes.length > 0) {
      return res.status(409).send({ 
        message: "A recipe with the same title already exists in the database under this user.", 
        success: false 
      });
    }

    // Fetch the current max ID from the database
    const maxIdQuery = `SELECT MAX(id) as maxId FROM MyRecipes`;
    const result = await DButils.execQuery(maxIdQuery);

    // Determine the next ID
    const nextId = result[0].maxId ? result[0].maxId + 1 : 1000000000;

    // Insert the new recipe with the generated ID
    const insertQuery = `INSERT INTO MyRecipes (id, username, title, image_url, ready_in_minutes, aggregate_likes, vegetarian, vegan, gluten_free, summary, ingredients, instructions, servings)
      VALUES (${nextId}, '${username}', '${title}', '${image_url}', ${ready_in_minutes}, ${aggregate_likes}, ${vegetarian}, ${vegan}, ${gluten_free}, '${summary}', '${JSON.stringify(ingredients)}', '${JSON.stringify(instructions)}', ${servings})`;

    await DButils.execQuery(insertQuery);

    res.status(200).send({ message: "The recipe has been successfully added to the database.", success: true });
  } catch (error) {
    console.error("Error creating recipe:", error);
    res.status(500).send({ 
      message: "An unexpected error occurred. Please try again later.", 
      success: false 
    });
    next(error);
  }
});
// module.exports = router;


/**
 * This path is for searching a recipe
 */
router.get("/search", async (req, res, next) => {
  try {
    const recipeName = req.query.recipeName;
    const cuisine = req.query.cuisine;
    const diet = req.query.diet;
    const intolerance = req.query.intolerance;
    const number = req.query.number || 5;

    // Fetch recipes based on the search criteria
    const results = await recipes_utils.searchRecipe(recipeName, cuisine, diet, intolerance, number);

    if (results.length === 0) {
      // If no recipes are found, return 404
      return res.status(404).send({ message: "No recipes found matching the search criteria." });
    }

    // Return the search results with a 200 status
    res.status(200).send(results);
  } catch (error) {
    // Log the error for debugging
    console.error("Error during recipe search:", error);

    // Send a 500 error response if something goes wrong
    res.status(500).send({ message: "An error occurred while searching for recipes. Please try again later." });
  }
});

/**
 * This path returns a full details of a recipe by its id
 */
router.get('/recipe/:recipeId', async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
    
    if (!recipe) {
      // If the recipe is not found, return 404
      return res.status(404).send({ message: "Recipe not found." });
    }

    // Return the recipe details with a 200 status
    res.status(200).send(recipe);
  } catch (error) {
    console.error("Error fetching recipe details:", error);

    // Send a 500 error response if something goes wrong
    res.status(500).send({ message: "An error occurred while retrieving the recipe. Please try again later." });
  }
});


// router.get('/myRecipes', async (req, res, next) => {
//   try {
//     const username = req.session.user_id;
//     const query = `SELECT * FROM MyRecipes WHERE username = '${username}'`;
//     const myRecipes = await DButils.execQuery(query);

//     res.status(200).send(myRecipes);
//   } catch (error) {
//     console.error("Error retrieving user's recipes:", error);
//     next(error);
//   }
// });
router.get('/myRecipes', async (req, res, next) => {
  try {
    const username = req.session.user_id;
    const query = `SELECT * FROM MyRecipes WHERE username = '${username}'`;
    const myRecipes = await DButils.execQuery(query);

    // Map the result from the database to match the expected structure
    const formattedRecipes = myRecipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image_url, // Make sure this is properly named in your DB
      readyInMinutes: recipe.ready_in_minutes, // Match the property name expected by the component
      aggregateLikes: recipe.aggregate_likes,
      vegetarian: recipe.vegetarian === 1, // Convert DB values (if boolean is stored as int)
      vegan: recipe.vegan === 1,           // Same for vegan
      glutenFree: recipe.gluten_free === 1, // Same for glutenFree
      summary: recipe.summary
    }));

    res.status(200).send(formattedRecipes);
  } catch (error) {
    console.error("Error retrieving user's recipes:", error);
    next(error);
  }
});

router.get("/Random", async (req, res, next) => {
  try {
    // Get the 'count' parameter from the query string or default to 3 if not provided
    const count = parseInt(req.query.count) || 3;
    
    // Fetch random recipes using the provided count
    const recipes = await recipes_utils.getRandomRecipes(count);
    
    res.send(recipes);
  } catch (error) {
    next(error);
  }
});


/**
 * This path returns the full details of a recipe by its id
 */
router.get('/recipeFullDetails/:recipeId', async (req, res, next) => {
  try {
    const recipeId = req.params.recipeId;
    const username = req.session.user_id; // Assuming session stores the logged-in user



    // If the recipe doesn't exist in 'MyRecipes', fetch from external API or other source
    const recipe = await recipes_utils.getRecipeFullDetails(recipeId);
    
    if (!recipe) {
      // If the recipe is not found, return 404
      return res.status(404).send({ message: "Recipe not found." });
    }

    // Return the full recipe details with a 200 status
    res.status(200).send(recipe);
  } catch (error) {
    console.error("Error fetching full recipe details:", error);

    // Send a 500 error response if something goes wrong
    res.status(500).send({ message: "An error occurred while retrieving the recipe details. Please try again later." });
  }
});


router.get('/myRecipeFullDetails/:recipeId', async (req, res, next) => {
  try {
    const recipeId = req.params.recipeId;
    const username = req.session.user_id; // Assuming session stores the logged-in user

    // Check if the recipe exists in the 'MyRecipes' table
    const query = `SELECT * FROM MyRecipes WHERE username = '${username}' AND id = ${recipeId}`;
    const myRecipes = await DButils.execQuery(query);

    if (myRecipes.length > 0) {
      // If the recipe exists in 'MyRecipes', format and return it
      const myRecipe = myRecipes[0];
      
      // Check if ingredients and instructions exist, and parse them if they do
      const ingredients = myRecipe.ingredients ? JSON.parse(myRecipe.ingredients) : [];
      const instructions = myRecipe.instructions ? JSON.parse(myRecipe.instructions) : [];
      

      // Format the recipe
      const formattedRecipe = {
        id: myRecipe.id,
        title: myRecipe.title,
        image: myRecipe.image_url, // Make sure this is the correct field name in the DB
        readyInMinutes: myRecipe.ready_in_minutes,
        aggregateLikes: myRecipe.aggregate_likes,
        vegetarian: myRecipe.vegetarian === 1, // Convert integer to boolean
        vegan: myRecipe.vegan === 1,           // Same for vegan
        glutenFree: myRecipe.gluten_free === 1, // Same for glutenFree
        servings: myRecipe.servings,
        summary: myRecipe.summary,
        ingredients: ingredients,              // Parsed ingredients (or empty array if missing)
        instructions: instructions            // Parsed instructions (or empty array if missing)
      };

      // Send the formatted recipe as the response
      return res.status(200).send({ recipe: formattedRecipe });
    }
  } catch (error) {
    console.error("Error fetching full recipe details:", error);

    // Send a 500 error response if something goes wrong
    res.status(500).send({ message: "An error occurred while retrieving the recipe details. Please try again later." });
  }
});
// router.get('/familyRecipe/:recipeId', async (req, res, next) => {
//   try {
//     const familyRecipes = await DButils.execQuery(`SELECT * FROM familyRecipes WHERE id='${req.params.recipeId}'`);
    
//     res.send(familyRecipes);
//   } catch (error) {
//     next(error);
//   }
// });

// router.get("/familyRecipes", async (req, res, next) => {
//   try {
//     const recipes = await DButils.execQuery(`SELECT 
//       title, 
//       image_url, 
//       ready_in_minutes, 
//       vegetarian, 
//       vegan, 
//       gluten_free, 
//       recipeBy, 
//       familyOccasions 
//       FROM familyRecipes`);

//     res.send(recipes);
//   } catch (error) {
//     next(error);
//   }
// });


module.exports = router;
