const axios = require('axios');
const api_domain = 'https://api.spoonacular.com/recipes';

async function getRecipeInformation(recipe_id) {
  return await axios.get(`${api_domain}/${recipe_id}/information`, {
    params: {
      includeNutrition: false,
      apiKey: process.env.spooncular_apiKey
    }
  });
}

// Added the new function to get full recipe details
async function getRecipeFullDetails(recipe_id) {
  try {
    const response = await getRecipeInformation(recipe_id);

    // Extracting relevant details, including nutrition
    let {
      id,
      title,
      readyInMinutes,
      image,
      aggregateLikes, // Matches the popularity key from the JSON
      vegan,
      vegetarian,
      glutenFree,
      servings,
      extendedIngredients,
      instructions,   // This will be returned as plain text, update it to match the HTML in the JSON example
      summary,
      nutrition
    } = response.data;

    // Format the instructions into an ordered list (ol) format, similar to the example JSON
    const formattedInstructions = `<ol>` + instructions.split('.').map(step => `<li>${step.trim()}</li>`).join('') + `</ol>`;

    return {
      id: id,
      title: title,
      readyInMinutes: readyInMinutes,
      image: image,
      aggregateLikes: aggregateLikes, // Using aggregateLikes instead of popularity
      vegan: vegan,
      vegetarian: vegetarian,
      glutenFree: glutenFree,
      servings: servings,
      ingredients: extendedIngredients.map(ingredient => ({
        name: ingredient.name,
        amount: ingredient.amount,
        unit: ingredient.unit
      })),
      instructions: formattedInstructions, // Match the formatted instruction style
      summary: summary,
      nutrition: nutrition ? nutrition.nutrients : [] // Return nutritional data if available
    };
  } catch (error) {
    console.error(`Error fetching full recipe details for recipe ID ${recipe_id}:`, error);
  }
}

async function getRecipeDetails(recipe_id) {
  let recipe_info = await getRecipeInformation(recipe_id);
  let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;

  return {
    id: id,
    title: title,
    readyInMinutes: readyInMinutes,
    image: image,
    popularity: aggregateLikes,
    vegan: vegan,
    vegetarian: vegetarian,
    glutenFree: glutenFree
  };
}

async function searchRecipe(recipeName, cuisine, diet, intolerance, number) {
  const response = await axios.get(`${api_domain}/complexSearch`, {
    params: {
      query: recipeName,
      cuisine: cuisine,
      diet: diet,
      intolerances: intolerance,
      number: number,
      apiKey: process.env.spooncular_apiKey,
      addRecipeInformation: true
    }
  });

  // Extract relevant data for preview
  return response.data.results.map(recipe => ({
    id: recipe.id,
    title: recipe.title,
    readyInMinutes: recipe.readyInMinutes,
    image: recipe.image,
    aggregateLikes: recipe.aggregateLikes,
    vegan: recipe.vegan,
    vegetarian: recipe.vegetarian,
    glutenFree: recipe.glutenFree
  }));
}

async function getRecipeInformationForPreview(recipe_id) {
  return await axios.get(`${api_domain}/${recipe_id}/information`, {
    params: {
      includeNutrition: true,
      apiKey: process.env.spooncular_apiKey
    }
  });
}

async function getRecipesPreview(recipe_ids) {
  let promises = recipe_ids.map(async (id) => {
    let recipe_info = await getRecipeInformationForPreview(id);
    let {
      id: recipeId,
      title,
      readyInMinutes,
      image,
      aggregateLikes,
      vegan,
      vegetarian,
      glutenFree,
      summary
    } = recipe_info.data;

    return {
      id: recipeId,
      image: image,
      title: title,
      readyInMinutes: readyInMinutes,
      aggregateLikes: aggregateLikes,
      vegetarian: vegetarian,
      vegan: vegan,
      glutenFree: glutenFree,
      summary: summary
    };
  });

  return Promise.all(promises);
}

async function getRandomRecipes(count) {
  try {
    const response = await axios.get(`${api_domain}/random`, {
      params: {
        apiKey: process.env.spooncular_apiKey,
        number: count // 'number' is the correct parameter for the Spoonacular API to specify how many recipes to fetch
      }
    });

    // Extract relevant data from the random recipes
    return response.data.recipes.map(recipe => {
      let {
        id,
        title,
        readyInMinutes,
        image,
        aggregateLikes,
        vegan,
        vegetarian,
        glutenFree,
        summary
      } = recipe;

      return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        aggregateLikes: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,
        summary: summary
      };
    });
  } catch (error) {
    console.error("Error fetching random recipes:", error);
    throw error;
  }
}


module.exports = {
  getRecipeDetails,
  searchRecipe,
  getRecipesPreview,
  getRandomRecipes,
  getRecipeFullDetails
};