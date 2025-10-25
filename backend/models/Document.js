import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  data: {
    type: Buffer,
    required: false // Optional for URL-based documents
  },
  contentType: {
    type: String,
    required: false // Optional for URL-based documents
  },
  size: {
    type: Number,
    required: false // Optional for URL-based documents
  },
  
  link: {
    type: String,
    required: false, // Optional for file-based documents
    trim: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Don't include the binary data when converting to JSON
documentSchema.methods.toJSON = function() {
  const doc = this.toObject();
  delete doc.data;
  return doc;
};

const Document = mongoose.model('Document', documentSchema);

export default Document;