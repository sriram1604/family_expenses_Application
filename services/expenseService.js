// firebase/expenseService.js
import { db } from "../firebase/firebaseConfig.js";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";

const EXPENSES_COLLECTION = "expenses";

// Add a new expense document to Firestore
export const addExpense = async (expenseData) => {
  try {
    const docRef = await addDoc(collection(db, EXPENSES_COLLECTION), expenseData);
    return docRef.id;
  } catch (e) {
    console.error("Error adding document: ", e);
    throw e;
  }
};

// Get all expenses for a specific month
export const getExpensesByMonth = async (monthKey) => {
  try {
    const q = query(collection(db, EXPENSES_COLLECTION), where("monthKey", "==", monthKey));
    const snapshot = await getDocs(q);
    const expenses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // CONVERT THE TIMESTAMP TO A JAVASCRIPT DATE OBJECT
      date: doc.data().date?.toDate(),
    }));
    return expenses;
  } catch (e) {
    console.error("Error getting expenses: ", e);
    throw e;
  }
};

// Update an existing expense document
export const updateExpense = async (id, updatedData) => {
  try {
    const ref = doc(db, EXPENSES_COLLECTION, id);
    await updateDoc(ref, updatedData);
  } catch (e) {
    console.error("Error updating expense: ", e);
    throw e;
  }
};

// Delete an expense document
export const deleteExpense = async (id) => {
  try {
    const ref = doc(db, EXPENSES_COLLECTION, id);
    await deleteDoc(ref);
  } catch (e) {
    console.error("Error deleting expense: ", e);
    throw e;
  }
};