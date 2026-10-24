// Denne repository holder styr på indtægtsdata, så indtægter kan tilføjes, redigeres og fjernes som en almindelig post i appen.
import { createEntryRepository } from './entryRepository.js';

const repository = createEntryRepository('income');
export const getIncome = repository.get;
export const addIncome = repository.add;
export const updateIncome = repository.update;
export const deleteIncome = repository.remove;
export default repository;
