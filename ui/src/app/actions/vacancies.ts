'use server'

import { store } from "@/lib/store";
import { Vacancy } from "@/types";
import { revalidatePath } from "next/cache";

export async function createVacancyAction(data: {
    employer_id: string;
    title: string;
    description: string;
    location: string;
    employment_type: string;
    salary_min_usd?: number;
    salary_max_usd?: number;
    experience_min_years: number;
    education_field: string;
    skills: string[];
    preferred_skills: string[];
    mandatory_languages: string[];
}) {
    
    const newVacancy: Vacancy = {
        id: `vac${Date.now()}`,
        employer_id: data.employer_id, // e.g. 'emp1'
        title: data.title,
        description: data.description,
        location: data.location,
        employment_type: data.employment_type,
        experience_min_years: data.experience_min_years,
        salary_min_usd: data.salary_min_usd || 0,
        salary_max_usd: data.salary_max_usd || 0,
        status: "published",
        requirements: {
            skills: data.skills,
            experience_years: data.experience_min_years,
            location: data.location,
            mandatory_languages: data.mandatory_languages
        },
        preferred_skills: data.preferred_skills,
        education_field: data.education_field,
        keywords: [data.title, data.education_field, ...data.skills, ...data.preferred_skills].map(k => k.toLowerCase()),
        created_at: new Date().toISOString().split('T')[0]
    };

    await store.vacancies.add(newVacancy);

    // Revalidate routes so new vacancy appears
    revalidatePath('/employer');
    revalidatePath('/employer/vacancies');
    
    return { success: true, vacancy_id: newVacancy.id };
}

export async function analyzeVacancyAction(vacancyId: string) {
    try {
        const { createClient } = await import('@/lib/supabase/server');
        const { VacancyAIService } = await import('@/services/vacancyAIService');
        
        const supabase = await createClient();
        
        // fetch vacancy locally first
        const v = await store.vacancies.getById(vacancyId);
        if (!v) throw new Error("Vacancy not found");
        
        await VacancyAIService.triggerAnalysis(supabase, v.id, v);
        
        return { success: true };
    } catch (e: unknown) {
        // We log but do NOT throw to avoid killing the UX.
        // It falls back gracefully.
        const message = e instanceof Error ? e.message : String(e);
        console.error("Vacancy AI Action Failed gracefully:", e);
        return { success: false, error: message };
    }
}
