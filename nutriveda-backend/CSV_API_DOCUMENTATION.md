# NutriVeda Backend - CSV Integration API Documentation

## Overview
This API provides endpoints for uploading and managing food ingredients and recipes via CSV files, along with Ayurvedic diet planning capabilities.

## Base URL
```
http://localhost:3000/api/v1
```

## CSV File Formats

### Foods CSV Format
```csv
IngredientID,IngredientName,Category,VegNonVeg,Calories_100g,Protein_g,Carbs_g,Fat_g,Rasa,Virya,Guna,DoshaEffect
```

**Column Descriptions:**
- `IngredientID`: Unique identifier for the ingredient
- `IngredientName`: Name of the food ingredient
- `Category`: Food category (grains, vegetables, fruits, legumes, nuts, seeds, dairy, meat, fish, oils, spices, herbs, beverages, sweets, snacks)
- `VegNonVeg`: Classification (veg/non-veg)
- `Calories_100g`: Calories per 100g
- `Protein_g`: Protein content in grams per 100g
- `Carbs_g`: Carbohydrate content in grams per 100g
- `Fat_g`: Fat content in grams per 100g
- `Rasa`: Ayurvedic taste (sweet, sour, salty, pungent, bitter, astringent)
- `Virya`: Potency (heating, cooling, neutral)
- `Guna`: Qualities (comma-separated: light, heavy, oily, dry, etc.)
- `DoshaEffect`: Effect on doshas (format: V+,P-,K= where V=Vata, P=Pitta, K=Kapha, +=increases, -=decreases, ==neutral)

### Recipes CSV Format
```csv
recipe_id,name,meal_type,cuisine,instructions,prep_time,cook_time,servings,ayurveda_benefit,season,dosha_suitability,sustainability,age_group,allergens
```

**Column Descriptions:**
- `recipe_id`: Unique identifier for the recipe
- `name`: Recipe name
- `meal_type`: Type of meal (breakfast, lunch, dinner, snack)
- `cuisine`: Cuisine type
- `instructions`: Cooking instructions
- `prep_time`: Preparation time in minutes
- `cook_time`: Cooking time in minutes
- `servings`: Number of servings
- `ayurveda_benefit`: Ayurvedic health benefits
- `season`: Suitable seasons (comma-separated: spring, summer, monsoon, autumn, winter, all)
- `dosha_suitability`: Suitable doshas (comma-separated: vata, pitta, kapha, all)
- `sustainability`: Sustainability rating
- `age_group`: Suitable age groups (comma-separated: children, adults, elderly, all ages)
- `allergens`: Known allergens (comma-separated: dairy, nuts, gluten, none)

## API Endpoints

### Food Endpoints

#### Upload Food CSV
```http
POST /api/v1/foods/upload-csv
Content-Type: multipart/form-data

Form Data:
- csvFile: [CSV file]
```

**Response:**
```json
{
  "success": true,
  "message": "Foods uploaded successfully",
  "data": {
    "totalRows": 15,
    "successfulRows": 14,
    "errorRows": 1,
    "parseErrors": [],
    "insertErrors": [],
    "insertedFoods": [...]
  }
}
```

#### Get All Foods
```http
GET /api/v1/foods?limit=100
```

#### Search Foods
```http
GET /api/v1/foods/search?category=grains&vegNonVeg=veg&season=winter
```

#### Search Foods by Dosha
```http
GET /api/v1/foods/search/dosha?dosha=vata&impact=decreases
```

#### Get Food by ID
```http
GET /api/v1/foods/{id}
```

#### Clear All Foods (Development Only)
```http
DELETE /api/v1/foods/clear-all
```

### Recipe Endpoints

#### Upload Recipe CSV
```http
POST /api/v1/recipes/upload-csv
Content-Type: multipart/form-data

Form Data:
- csvFile: [CSV file]
```

#### Get All Recipes
```http
GET /api/v1/recipes?limit=100
```

#### Search Recipes
```http
GET /api/v1/recipes/search?mealType=lunch&season=winter&dosha=vata&maxCookTime=30
```

#### Get Recipes by Meal Type
```http
GET /api/v1/recipes/meal-type/{mealType}
```

#### Get Recipes by Season
```http
GET /api/v1/recipes/season/{season}
```

#### Get Recipes by Dosha
```http
GET /api/v1/recipes/dosha/{dosha}
```

#### Get Recipe by ID
```http
GET /api/v1/recipes/{id}
```

#### Update Recipe
```http
PUT /api/v1/recipes/{id}
Content-Type: application/json

{
  "name": "Updated Recipe Name",
  "instructions": "Updated instructions"
}
```

#### Delete Recipe
```http
DELETE /api/v1/recipes/{id}
```

#### Clear All Recipes (Development Only)
```http
DELETE /api/v1/recipes/clear-all
```

## Testing

### Running the Server
```bash
npm start
# or for development
npm run dev
```

### Running CSV Integration Tests
```bash
node tests/csvIntegrationTest.js
```

### Using Sample Data
Sample CSV files are provided in the `sample_data/` directory:
- `foods_sample.csv` - Sample food ingredients
- `recipes_sample.csv` - Sample recipes

## Error Handling

The API provides detailed error responses including:
- Parse errors for invalid CSV data
- Validation errors for missing required fields
- Insert errors for database operation failures

Example error response:
```json
{
  "success": false,
  "message": "Error uploading CSV: Invalid dosha effect format",
  "data": {
    "parseErrors": [
      {
        "row": 5,
        "data": {...},
        "error": "IngredientName is required"
      }
    ]
  }
}
```

## Health Check

```http
GET /health
```

Returns server status and database connectivity information.

## Environment Configuration

Make sure your `.env` file includes:
```env
PORT=3000
NODE_ENV=development
# Firebase configuration...
# JWT configuration...
```
