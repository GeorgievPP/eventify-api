import { roles } from '../config/roles.js';

export const hasPermission = (user, permissionName) => {
    if (!user || !user.role) return false;

    const roleConfig = roles[user.role];
    if (!roleConfig) return false;

    return !!roleConfig[permissionName];
};
