import { Candidate, Employer, Vacancy } from "@/types";

export interface ICandidateRepository {
  getAll(): Promise<Candidate[]>;
  getById(id: string): Promise<Candidate | null>;
  add(candidate: Candidate): Promise<void>;
}

export interface IEmployerRepository {
  getAll(): Promise<Employer[]>;
  getById(id: string): Promise<Employer | null>;
  add(employer: Employer): Promise<void>;
}

export interface IVacancyRepository {
  getAll(): Promise<Vacancy[]>;
  getById(id: string): Promise<Vacancy | null>;
  getByEmployerId(employerId: string): Promise<Vacancy[]>;
  add(vacancy: Vacancy): Promise<void>;
}
