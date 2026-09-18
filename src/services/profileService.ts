import api from './api';
import { type Category } from '../types/category';

// Types for profile operations
export interface ProfileData {
    _id: string;
    role: string;
    fullName: string;
    phoneNumber: string;
    email: string;
    avatar?: string; // Cloudinary URL
    isActive: boolean;
    expertise?: string[];
    categories?: Category[]; // populated — agent's selected service categories
    categoryLimit?: number; // effective limit from the agent's subscription (or the new-agent default)
    subscription?: {
        _id: string;
        name: string;
        price: number;
        features: string[];
        categoryLimit?: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface UpdateProfileData {
    fullName?: string;
    phoneNumber?: string;
    expertise?: string[];
    categories?: string[]; // category ids — agents only
    avatar?: string; // Cloudinary URL
}

export interface ProfileResponse {
    success: boolean;
    message: string;
    data: ProfileData;
}

export interface UpdateProfileResponse {
    success: boolean;
    message: string;
}

// Profile API functions
export const profileService = {
    // Get user profile
    getProfile: async (): Promise<ProfileResponse> => {
        try {
            const response = await api.get('/profile');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Update user profile (JSON)
    updateProfile: async (profileData: UpdateProfileData): Promise<UpdateProfileResponse> => {
        try {
            const response = await api.put('/profile', profileData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Update user profile with FormData (for file uploads like avatar)
    updateProfileWithFormData: async (profileData: UpdateProfileData, avatarFile?: File): Promise<ProfileResponse> => {
        try {
            const formData = new FormData();

            if (profileData.fullName) formData.append('fullName', profileData.fullName);
            if (profileData.phoneNumber) formData.append('phoneNumber', profileData.phoneNumber);
            if (profileData.expertise) {
                profileData.expertise.forEach(exp => formData.append('expertise', exp));
            }
            if (profileData.categories) {
                profileData.categories.forEach(cat => formData.append('categories', cat));
            }
            if (avatarFile) {
                formData.append('avatar', avatarFile);
            }

            const response = await api.put('/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Change your own password. Verifies the current one server-side, and
    // invalidates every token this account holds — the caller must sign out.
    updatePassword: async (data: {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    }): Promise<{ success: boolean; message: string }> => {
        // No try/catch: an axios rejection propagates to the caller either way,
        // and the wrapper the sibling methods use is a lint error.
        const response = await api.put('/profile/password', data);
        return response.data;
    },

    // Upload avatar
    uploadAvatar: async (file: File): Promise<string> => {
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            const response = await api.put('/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data.data.avatar;
        } catch (error) {
            throw error;
        }
    }
};
