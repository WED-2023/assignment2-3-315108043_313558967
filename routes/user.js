var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
// router.use(async function (req, res, next) {
//   if (req.session && req.session.user_id) {
//     DButils.execQuery("SELECT username FROM users").then((users) => {
//       if (users.find((x) => x.user_id === req.session.user_id)) {
//         req.user_id = req.session.user_id;
//         next();
//       }
//     }).catch(err => next(err));
//   } else {
//     res.sendStatus(401);
//   }
// });

router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    // No need to check the DB again, just use the user_id from the session
    console.log("I am here " + req.session.user_id)
    req.user_id = req.session.user_id;
    next();
  } else {
    res.sendStatus(401); // Unauthorized if no session exists
  }
});


// /**
//  * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
//  */
// router.post('/favorites', async (req,res,next) => {
//   try{
//     const user_id = req.session.user_id;
//     const recipe_id = req.body.recipeId;
//     await user_utils.markAsFavorite(user_id,recipe_id);
//     res.status(200).send("The Recipe successfully saved as favorite");
//     } catch(error){
//     next(error);
//   }
// })

// /**
//  * This path returns the favorites recipes that were saved by the logged-in user
//  */
// router.get('/favorites', async (req,res,next) => {
//   try{
//     const user_id = req.session.user_id;
//     let favorite_recipes = {};
//     const recipes_id = await user_utils.getFavoriteRecipes(user_id);
//     let recipes_id_array = [];
//     recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
//     const results = await recipe_utils.getRecipesPreview(recipes_id_array);
//     res.status(200).send(results);
//   } catch(error){
//     next(error); 
//   }
// });


/**
 * This path gets body with recipeId and saves this recipe in the favorites list of the logged-in user
 */
router.post('/favorites', async (req, res, next) => {
  try {
    const user_id = req.session.user_id // Get user_id from the middleware
    const recipe_id = req.body.recipeId;

    // Validate input
    if (!user_id) {
      return res.status(400).send("User ID is missing from session.");
    }

    if (!recipe_id) {
      return res.status(400).send("Recipe ID is missing in the request body.");
    }

    // Attempt to mark recipe as favorite
    await user_utils.markAsFavorite(user_id, recipe_id);
    res.status(200).send("The Recipe successfully saved as favorite");
  } catch (error) {
    // Check for specific error types
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).send("The recipe is already marked as a favorite.");
    } else if (error.message.includes("foreign key constraint")) {
      res.status(400).send("Invalid recipe ID or user ID.");
    } else {
      // Log and pass on unexpected errors
      console.error("Unexpected error occurred:", error);
      res.status(500).send("An unexpected error occurred. Please try again later.");
    }
  }
});

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get('/favorites', async (req, res, next) => {
  try {
    const user_id = req.user_id; // Get user_id from the middleware
    let favorite_recipes = {};
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    // let recipes_id_array = [];
    // recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); // Extracting the recipe ids into an array
    // const results = await recipe_utils.getRecipesPreview(recipes_id_array);
    if (!user_id) {
      return res.status(401).send("User ID is missing from session."); 
    }
    res.status(200).send(recipes_id);
  } catch (error) {
    next(error);
  }
});


/**
 * This path checks if a recipe is favorited by the logged-in user.
 */
router.get('/favorites/:recipeId', async (req, res, next) => {
  try {
    console.log("here -------------------------------------------------")
    const user_id = req.session.user_id; // Get user_id from the session
    const recipe_id = req.params.recipeId;
    console.log("user_id = " + user_id + ", recipe_id = " + recipe_id)
    // Validate input
    if (!user_id) {
      return res.status(400).send("User ID is missing from session.");
    }

    if (!recipe_id) {
      return res.status(400).send("Recipe ID is missing from the request.");
    }

    // Check if the recipe is in the user's favorites
    const isFavorite = await user_utils.isRecipeFavorited(user_id, recipe_id);
    console.log("isFavorite = " + isFavorite)
    if (isFavorite) {
      return res.status(200).send({ favorited: true });
    } else {
      return res.status(200).send({ favorited: false });
    }
  } catch (error) {
    console.error("Unexpected error occurred:", error);
    res.status(500).send("An unexpected error occurred. Please try again later.");
  }
});



module.exports = router;
