var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
const DButils = require("../routes/utils/DButils"); // Ensure the path is correct

router.get("/", (req, res) => res.send("im here"));



router.post("/AddNewRecipe", async (req, res, next) => {
  try {
    const { username, title, image_url, ready_in_minutes, aggregate_likes, vegetarian, vegan, gluten_free, summary, ingredients, instructions, servings } = req.body;

    console.log(req.body);

    if (!username || !title || !image_url || ready_in_minutes == null || aggregate_likes == null || servings == null || !summary || !ingredients || !instructions) {
      console.log("Invalid input data:", {
        username, title, image_url, ready_in_minutes, aggregate_likes, servings, summary, ingredients, instructions
      });
      return res.status(400).send({ message: "The provided input data is invalid. Please check the input and try again.", success: false });
    }

    // Check if a recipe with the same title already exists for this user
    const checkQuery = `SELECT * FROM MyRecipes WHERE username = '${username}' AND title = '${title}'`;
    const existingRecipes = await DButils.execQuery(checkQuery);

    if (existingRecipes.length > 0) {
      return res.status(409).send({ message: "A recipe with the same title already exists in the database under this user.", success: false });
    }

    // Insert the new recipe into the database
    const insertQuery = `INSERT INTO MyRecipes (username, title, image_url, ready_in_minutes, aggregate_likes, vegetarian, vegan, gluten_free, summary, ingredients, instructions, servings)
      VALUES ('${username}', '${title}', '${image_url}', ${ready_in_minutes}, ${aggregate_likes}, ${vegetarian}, ${vegan}, ${gluten_free}, '${summary}', '${JSON.stringify(ingredients)}', '${JSON.stringify(instructions)}', ${servings})`;

    await DButils.execQuery(insertQuery);

    res.status(201).send({ message: "The recipe has been successfully added to the database.", success: true });
  } catch (error) {
    console.error("Error creating recipe:", error);
    next(error);
  }
});

module.exports = router;


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
    const results = await recipes_utils.searchRecipe(recipeName, cuisine, diet, intolerance, number);
    res.send(results);
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns a full details of a recipe by its id
 */
router.get('/recipe/:recipeId', async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});


module.exports = router;
