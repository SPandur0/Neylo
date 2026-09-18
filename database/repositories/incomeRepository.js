import { createEntryRepository } from './entryRepository.js';

const repository = createEntryRepository('income');
export const getIncome = repository.get;
export const addIncome = repository.add;
export const updateIncome = repository.update;
export const deleteIncome = repository.remove;
export default repository;
