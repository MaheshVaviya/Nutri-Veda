const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static collection = 'users';

  static async create(userData) {
    // Check if user already exists
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    const user = {
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      name: userData.name,
      role: userData.role || 'dietitian', // dietitian, admin, assistant
      isActive: true,
      isVerified: false,
      profile: {
        qualification: userData.qualification || '',
        experience: parseInt(userData.experience) || 0,
        specialization: Array.isArray(userData.specialization) ? 
          userData.specialization : (userData.specialization ? [userData.specialization] : []),
        clinicName: userData.clinicName || '',
        clinicAddress: userData.clinicAddress || '',
        phone: userData.phone || '',
        license: userData.license || ''
      },
      settings: {
        defaultLanguage: userData.defaultLanguage || 'english',
        timezone: userData.timezone || 'Asia/Kolkata',
        notifications: {
          email: true,
          sms: false,
          whatsapp: false
        }
      },
      stats: {
        totalPatients: 0,
        totalDietCharts: 0,
        joinedDate: new Date()
      }
    };

    return await db.create(this.collection, user);
  }

  static async findByEmail(email) {
    const users = await db.findByField(this.collection, 'email', email.toLowerCase());
    return users.length > 0 ? users[0] : null;
  }

  static async findById(id) {
    return await db.findById(this.collection, id);
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updatePassword(id, newPassword) {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    return await db.update(this.collection, id, { password: hashedPassword });
  }

  static async update(id, userData) {
    // Remove password from update data if present
    const { password, ...updateData } = userData;
    return await db.update(this.collection, id, updateData);
  }

  static async updateStats(id, statsUpdate) {
    const user = await this.findById(id);
    if (!user) throw new Error('User not found');

    const updatedStats = { ...user.stats, ...statsUpdate };
    return await db.update(this.collection, id, { stats: updatedStats });
  }
}

module.exports = User;