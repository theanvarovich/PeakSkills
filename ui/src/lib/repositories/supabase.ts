/* eslint-disable @typescript-eslint/no-explicit-any */
import { Candidate, Employer, Vacancy } from "@/types";
import { ICandidateRepository, IEmployerRepository, IVacancyRepository } from "./interfaces";
import { createClient } from "@/lib/supabase/server";

export class SupabaseCandidateRepository implements ICandidateRepository {
  async getAll(): Promise<Candidate[]> {
    const supabase = await createClient();
    // In a real app we might only query public fields. 
    // This leverages the unified schema where candidate joins sub-tables.
    // For MVP phase 4B we query all required associations
    const { data, error } = await supabase
      .from('candidates')
      .select(`
        *,
        education:candidate_education(*),
        languages:candidate_languages(*),
        experience:candidate_experience(*),
        certifications:candidate_certifications(*),
        skills:candidate_skills(skills(*))
      `);

    if (error) {
      console.error(error);
      return [];
    }

    // Transform nested Supabase data into uniform Candidate type
    return data.map(this.mapCandidate);
  }

  async getById(id: string): Promise<Candidate | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('candidates')
      .select(`
        *,
        education:candidate_education(*),
        languages:candidate_languages(*),
        experience:candidate_experience(*),
        certifications:candidate_certifications(*),
        skills:candidate_skills(skills(*))
      `)
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapCandidate(data);
  }

  async add(candidate: Candidate): Promise<void> {
    // Adding candidates securely requires authenticated context and cascading inserts handled via RPC or backend flows.
    // For repo structure, we assume inserting via Supabase SDK.
    const supabase = await createClient();
    await supabase.from('candidates').insert({
        id: candidate.id,
        first_name: candidate.name.split(' ')[0] || '',
        last_name: candidate.name.split(' ').slice(1).join(' ') || '',
        candidate_type: candidate.candidate_type,
        location: candidate.location,
        headline: candidate.headline,
        bio: candidate.bio,
        cv_summary: candidate.cvSummary,
        expected_salary_usd: candidate.expected_salary_usd,
        experience_years: candidate.experienceYears,
        preferred_roles: candidate.preferredRoles,
        achievements: candidate.achievements,
        is_exchange_ready: candidate.isExchangeReady,
        is_sponsorship_ready: candidate.isSponsorshipReady,
        is_internship_ready: candidate.isInternshipReady,
        academic_achievements: candidate.academicAchievements,
        current_position: candidate.currentPosition,
        current_company: candidate.currentCompany,
        career_achievements: candidate.careerAchievements
    });
    // Note: robust implementations also cascade insert to matching sub-tables (candidate_skills, candidate_education)
  }

   
  private mapCandidate(data: any): Candidate {
    return {
      id: data.id,
      name: `${data.first_name} ${data.last_name}`.trim(),
      email: data.email || '', // Joined from private if auth permits, else excluded
      candidate_type: data.candidate_type,
      location: data.location,
      headline: data.headline,
      cvSummary: data.cv_summary,
      bio: data.bio,
      expected_salary_usd: data.expected_salary_usd,
      experienceYears: data.experience_years,
      preferredRoles: data.preferred_roles || [],
      achievements: data.achievements || [],
      
      // Map relations safely. Take the primary/active education if array, or first logic
      education: data.education && data.education.length > 0 ? {
        institution: data.education[0].institution_override || '',
        degree: data.education[0].degree,
        field_of_study: data.education[0].field_of_study,
        gpa: data.education[0].gpa,
        gpaNumeric: data.education[0].gpa_numeric,
        graduation_year: data.education[0].graduation_year,
        is_current: data.education[0].is_current
      } : { institution: '', degree: '', field_of_study: '' },
      
      languages: data.languages ? data.languages.map((l: any) => ({
        language: l.language, level: l.level, certification: l.certification
      })) : [],
      
      experience: data.experience ? data.experience.map((e: any) => ({
        company: e.company, title: e.title, years: e.years, description: e.description, skills_used: e.skills_used
      })) : [],
      
      certifications: data.certifications ? data.certifications.map((c: any) => c.name) : [],
      skills: (data.skills || []).map((s: any) => s.skills?.name).filter(Boolean),
      
      isExchangeReady: data.is_exchange_ready,
      isSponsorshipReady: data.is_sponsorship_ready,
      isInternshipReady: data.is_internship_ready,
      academicAchievements: data.academic_achievements || [],
      currentPosition: data.current_position,
      currentCompany: data.current_company,
      careerAchievements: data.career_achievements || []
    };
  }
}

export class SupabaseEmployerRepository implements IEmployerRepository {
  async getAll(): Promise<Employer[]> {
    const supabase = await createClient();
    const { data } = await supabase.from('employers').select('*');
    return data ? data.map(this.mapEmployer) : [];
  }

  async getById(id: string): Promise<Employer | null> {
    const supabase = await createClient();
    const { data } = await supabase.from('employers').select('*').eq('id', id).single();
    return data ? this.mapEmployer(data) : null;
  }

  async add(employer: Employer): Promise<void> {
    const supabase = await createClient();
    await supabase.from('employers').insert({
        id: employer.id,
        company_name: employer.company_name,
        industry: employer.industry,
        description: employer.description,
        location: employer.location,
        website: employer.website,
        company_size: employer.size,
    });
  }

   
  private mapEmployer(data: any): Employer {
    return {
      id: data.id,
      company_name: data.company_name,
      industry: data.industry,
      location: data.location,
      size: data.company_size,
      description: data.description,
      website: data.website
    };
  }
}


export class SupabaseVacancyRepository implements IVacancyRepository {
  async getAll(): Promise<Vacancy[]> {
    const supabase = await createClient();
    const { data } = await supabase.from('vacancies').select('*, vacancy_requirements(*), vacancy_skills(skills(*))');
    return data ? data.map(this.mapVacancy) : [];
  }

  async getById(id: string): Promise<Vacancy | null> {
    const supabase = await createClient();
    const { data } = await supabase.from('vacancies').select('*, vacancy_requirements(*), vacancy_skills(skills(*))').eq('id', id).single();
    return data ? this.mapVacancy(data) : null;
  }

  async getByEmployerId(employerId: string): Promise<Vacancy[]> {
    const supabase = await createClient();
    const { data } = await supabase.from('vacancies').select('*, vacancy_requirements(*), vacancy_skills(skills(*))').eq('employer_id', employerId);
    return data ? data.map(this.mapVacancy) : [];
  }

  async add(vacancy: Vacancy): Promise<void> {
    const supabase = await createClient();
    await supabase.from('vacancies').insert({
        id: vacancy.id,
        employer_id: vacancy.employer_id,
        title: vacancy.title,
        description: vacancy.description,
        location: vacancy.location,
        employment_type: vacancy.employment_type || 'Full-Time',
        experience_min_years: vacancy.experience_min_years,
        salary_min_usd: vacancy.salary_min_usd,
        salary_max_usd: vacancy.salary_max_usd,
        education_field: vacancy.education_field,
        status: vacancy.status
    });
    // For complete operation, requirements must also insert to sub-tables
  }

   
  private mapVacancy(data: any): Vacancy {
    const reqsArr = data.vacancy_requirements && data.vacancy_requirements.length > 0 ? data.vacancy_requirements[0] : {};
    
    // Split combined skills mappings back to strings, sorting optional if needed
    const mappedSkills = (data.vacancy_skills || []).map((s: any) => s.skills?.name).filter(Boolean) as string[];

    return {
      id: data.id,
      employer_id: data.employer_id,
      title: data.title,
      description: data.description,
      location: data.location,
      employment_type: data.employment_type,
      experience_min_years: data.experience_min_years,
      salary_min_usd: data.salary_min_usd,
      salary_max_usd: data.salary_max_usd,
      education_field: data.education_field,
      status: data.status,
      requirements: {
         skills: mappedSkills,
         experience_years: data.experience_min_years,
         location: data.location,
         mandatory_languages: reqsArr.mandatory_languages || [],
         mandatory_education: reqsArr.mandatory_education || []
      },
      preferred_skills: [], // Mappings could track is_mandatory to distinguish preferred
      keywords: [], // Rebuild from semantic mappings if persisted directly
      created_at: data.created_at
    };
  }
}
