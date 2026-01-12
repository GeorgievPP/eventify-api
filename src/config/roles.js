export const roles = {
    user: {
        canManageUsers: false,
        canManageEvents: false,
        canManageAllOrders: false,
        canViewUsers: false,
        canSeeDeletedUsers: false,
    },
    poweruser: {
        canManageUsers: false,
        canManageEvents: true,
        canManageAllOrders: true,
        canViewUsers: true,
        canSeeDeletedUsers: false,
    },
    admin: {
        canManageUsers: true,
        canManageEvents: true,
        canManageAllOrders: true,
        canViewUsers: true,
        canSeeDeletedUsers: true,
    },
};
