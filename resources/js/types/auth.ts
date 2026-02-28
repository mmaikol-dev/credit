export type Company = {
    id: number;
    name: string;
    slug: string;
};

export type User = {
    id: number;
    company_id: number | null;
    company?: Company | null;
    is_company_admin: boolean;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
