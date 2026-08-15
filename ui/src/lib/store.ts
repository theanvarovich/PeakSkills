import { SupabaseCandidateRepository, SupabaseEmployerRepository, SupabaseVacancyRepository } from "./repositories/supabase";
import { ICandidateRepository, IEmployerRepository, IVacancyRepository } from "./repositories/interfaces";

// Central instance registry for Repositories (Dependency Injection)
class Store {
  public candidates: ICandidateRepository;
  public employers: IEmployerRepository;
  public vacancies: IVacancyRepository;

  constructor() {
    this.candidates = new SupabaseCandidateRepository();
    this.employers = new SupabaseEmployerRepository();
    this.vacancies = new SupabaseVacancyRepository();
  }
}

// Export singleton instance
export const store = new Store();
