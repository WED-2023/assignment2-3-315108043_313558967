const recipe_utils = require("./recipes_utils"); // Assuming this contains the function to get random recipes
const user_utils = require("./user_utils"); // Assuming this contains the function to get favorite recipes

async function mainPage(req, res, next) {
  try {
    let randomRecipes = await recipe_utils.getRandomRecipes(3); // Fetch 3 random recipes

    if (req.session && req.session.user_id) {
      // User is logged in, get their favorite recipes
      const favoriteRecipes = await user_utils.getFavoriteRecipes(req.session.user_id);


      // Get only the first 3 favorite recipes if there are more
      const favoriteRecipesPreview = favoriteRecipes.slice(0, 3);


      res.status(200).send({
        message: "Welcome back! Here are your favorite recipes and some random suggestions.",
        favoriteRecipes: favoriteRecipesPreview,
        randomRecipes: randomRecipes,
        success: true
      });
    } else {
      // User is not logged in, just return random recipes
      res.status(200).send({
        message: "Welcome! Here are some random recipes for you.",
        randomRecipes: randomRecipes,
        success: true
      });
    }
  } catch (error) {
    console.error("Error fetching main page data:", error);
    res.status(500).send({ message: "An error occurred while fetching recipes", success: false });
  }
}

module.exports = {
  mainPage
};