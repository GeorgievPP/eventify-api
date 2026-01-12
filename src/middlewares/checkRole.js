import { hasPermission } from '../utils/permissions.js';

export const requirePermission = (permissionName) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        if (!hasPermission(req.user, permissionName)) {
            return res
                .status(403)
                .json({ message: 'You do not have permission to perform this action' });
        }

        next();
    };
};
