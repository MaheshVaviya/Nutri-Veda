const { db } = require('./firebase');

class DatabaseService {
  constructor() {
    this.db = db;
  }

  async create(collection, data) {
    try {
      const docRef = await this.db.collection(collection).add({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ Document created in ${collection} with ID: ${docRef.id}`);
      return { id: docRef.id, ...data };
    } catch (error) {
      console.error(`❌ Error creating document in ${collection}:`, error.message);
      throw new Error(`Error creating document: ${error.message}`);
    }
  }

  async findById(collection, id) {
    try {
      const doc = await this.db.collection(collection).doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error(`❌ Error finding document in ${collection}:`, error.message);
      throw new Error(`Error finding document: ${error.message}`);
    }
  }

  async findByField(collection, field, value) {
    try {
      const snapshot = await this.db.collection(collection)
        .where(field, '==', value)
        .get();
      
      if (snapshot.empty) {
        return [];
      }

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`❌ Error finding documents in ${collection}:`, error.message);
      throw new Error(`Error finding documents: ${error.message}`);
    }
  }

  async findAll(collection, limit = 100) {
    try {
      const snapshot = await this.db.collection(collection)
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`❌ Error finding all documents in ${collection}:`, error.message);
      throw new Error(`Error finding all documents: ${error.message}`);
    }
  }

  async update(collection, id, data) {
    try {
      await this.db.collection(collection).doc(id).update({
        ...data,
        updatedAt: new Date()
      });
      console.log(`✅ Document updated in ${collection} with ID: ${id}`);
      return { id, ...data };
    } catch (error) {
      console.error(`❌ Error updating document in ${collection}:`, error.message);
      throw new Error(`Error updating document: ${error.message}`);
    }
  }

  async delete(collection, id) {
    try {
      await this.db.collection(collection).doc(id).delete();
      console.log(`✅ Document deleted from ${collection} with ID: ${id}`);
      return { id };
    } catch (error) {
      console.error(`❌ Error deleting document from ${collection}:`, error.message);
      throw new Error(`Error deleting document: ${error.message}`);
    }
  }

  // Test database connection
  async testConnection() {
    try {
      const testDoc = await this.db.collection('_test').add({
        timestamp: new Date(),
        message: 'Connection test'
      });
      
      await this.db.collection('_test').doc(testDoc.id).delete();
      console.log('✅ Database connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection test failed:', error.message);
      return false;
    }
  }
}

module.exports = new DatabaseService();