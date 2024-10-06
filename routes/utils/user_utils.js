const DButils = require("./DButils");
const recipe_utils = require('./recipes_utils'); // Assuming recipe_utils contains getRecipesPreview

async function markAsFavorite(user_id, recipe_id) {
    try{
    const query = `INSERT IGNORE INTO FavoriteRecipes (username, recipe_id) VALUES ('${user_id}', ${recipe_id});`;
    await DButils.execQuery(query);
    }
    catch (error){
      console.log(error)
    }
  }

  async function getFavoriteRecipes(user_id) {
    // Step 1: Fetch the favorite recipe IDs from the database
    const recipes_id = await DButils.execQuery(`SELECT recipe_id FROM FavoriteRecipes WHERE username='${user_id}'`);
  
    // Step 2: Extract recipe IDs from the result (assuming result is an array of objects like [{recipe_id: 1}, {recipe_id: 2}, ...])
    const recipeIds = recipes_id.map(row => row.recipe_id);
  
    // Step 3: Fetch detailed information for each favorite recipe using getRecipesPreview
    if (recipeIds.length > 0) {
      return await recipe_utils.getRecipesPreview(recipeIds);
    } else {
      return []; // Return an empty array if there are no favorite recipes
    }
  }
  // const DButils = require("./DButils"); // Assuming you're using a DB utility

/**
 * Checks if a recipe is favorited by the user
 * @param {number} userId - The ID of the user
 * @param {number} recipeId - The ID of the recipe to check
 * @returns {boolean} - Returns true if the recipe is favorited, false otherwise
 */
async function isRecipeFavorited(userId, recipeId) {
  try {
    const query = `SELECT * FROM FavoriteRecipes WHERE username='${userId}' AND recipe_id='${recipeId}'`;
    const result = await DButils.execQuery(query);

    return result.length > 0; // If there's a record, it's favorited
  } catch (error) {
    console.error("Error checking if recipe is favorited:", error);
    throw error;
  }
}




module.exports = {
  isRecipeFavorited,
  getFavoriteRecipes,
  markAsFavorite
  // Other utility functions
};