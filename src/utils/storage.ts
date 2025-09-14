import { DailyNutrition, Meal } from "../types";

const calculateTotals = (meals: Meal[]) => {
  let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFats = 0;
  meals.forEach(meal => meal.foods.forEach(food => {
    totalCalories += food.calories;
    totalProtein += food.protein;
    totalCarbs += food.carbs;
    totalFats += food.fats;
  }));
  return { totalCalories, totalProtein, totalCarbs, totalFats };
};

export const getMealsForDate = (date: string): DailyNutrition => {
  if (typeof window === "undefined") return { date, totalCalories:0, totalProtein:0, totalCarbs:0, totalFats:0, meals:[] };
  const storedData = localStorage.getItem(`cal-ai-${date}`);
  return storedData ? JSON.parse(storedData) : { date, totalCalories:0, totalProtein:0, totalCarbs:0, totalFats:0, meals:[] };
};

export const saveMeal = (date: string, newMeal: Meal): DailyNutrition => {
  const data = getMealsForDate(date);
  data.meals.push(newMeal);
  const totals = calculateTotals(data.meals);
  const updated = { ...data, ...totals };
  localStorage.setItem(`cal-ai-${date}`, JSON.stringify(updated));
  return updated;
};

export const deleteMeal = (date: string, mealId: string): DailyNutrition => {
  const data = getMealsForDate(date);
  const meals = data.meals.filter(m => m.id !== mealId);
  const totals = calculateTotals(meals);
  const updated = { ...data, meals, ...totals };
  localStorage.setItem(`cal-ai-${date}`, JSON.stringify(updated));
  return updated;
};

export const updateMeal = (date: string, updatedMeal: Meal): DailyNutrition => {
  const data = getMealsForDate(date);
  const meals = data.meals.map(m => m.id === updatedMeal.id ? updatedMeal : m);
  const totals = calculateTotals(meals);
  const updated = { ...data, meals, ...totals };
  localStorage.setItem(`cal-ai-${date}`, JSON.stringify(updated));
  return updated;
};
