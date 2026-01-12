import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 6,
        },
        role: {
            type: String,
            enum: ['user', 'poweruser', 'admin'],
            default: 'user'
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Hash на паролата преди save – без next()
userSchema.pre('save', async function () {
    // this = текущия документ (user)
    if (!this.isModified('password')) return;

    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
});

// Метод за сравняване на парола
userSchema.methods.matchPassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
