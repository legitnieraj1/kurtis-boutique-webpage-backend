export type Profile = {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
};

export type Project = {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    status: 'active' | 'completed' | 'archived';
    created_at: string;
    updated_at: string;
};

export type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at'>;
export type ProjectUpdate = Partial<Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type UploadedFile = {
    id: string;
    name: string;
    path: string;
    size: number;
    type: string;
    url: string;
    created_at: string;
};
