import { Candidate, Employer, Vacancy } from "@/types";
import { ICandidateRepository, IEmployerRepository, IVacancyRepository } from "./interfaces";
import { candidates, employers, vacancies } from "../data";

// Module-level singletons for session persistence in dev
const _candidates = [...candidates];
const _employers = [...employers];
const _vacancies = [...vacancies];

export class InMemoryCandidateRepository implements ICandidateRepository {
  async getAll(): Promise<Candidate[]> {
    return _candidates;
  }
  async getById(id: string): Promise<Candidate | null> {
    return _candidates.find(c => c.id === id) || null;
  }
  async add(candidate: Candidate): Promise<void> {
    _candidates.push(candidate);
  }
}

export class InMemoryEmployerRepository implements IEmployerRepository {
  async getAll(): Promise<Employer[]> {
    return _employers;
  }
  async getById(id: string): Promise<Employer | null> {
    return _employers.find(e => e.id === id) || null;
  }
  async add(employer: Employer): Promise<void> {
    _employers.push(employer);
  }
}

export class InMemoryVacancyRepository implements IVacancyRepository {
  async getAll(): Promise<Vacancy[]> {
    return _vacancies;
  }
  async getById(id: string): Promise<Vacancy | null> {
    return _vacancies.find(v => v.id === id) || null;
  }
  async getByEmployerId(employerId: string): Promise<Vacancy[]> {
    return _vacancies.filter(v => v.employer_id === employerId);
  }
  async add(vacancy: Vacancy): Promise<void> {
    _vacancies.unshift(vacancy); // Add to top for UI consistency
  }
}
