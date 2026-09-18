import { createEntryRepository } from './entryRepository.js';

const repository = createEntryRepository('savings', 'investments');
export const getInvestments = repository.get;
export const addInvestment = repository.add;
export const updateInvestment = repository.update;
export const deleteInvestment = repository.remove;
export default repository;
