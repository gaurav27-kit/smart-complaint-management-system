/**
 * @file teardown.js
 * @description Programmatic database teardown utilities for tests.
 */

import { closeTestDB, clearTestDB } from "./helpers/dbHelper.js";

export const teardown = async () => {
  await closeTestDB();
};

export const reset = async () => {
  await clearTestDB();
};
