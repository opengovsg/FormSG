/* eslint-disable */

// This script parses the existing paragraph field which is stored as a markdown string into HTML elements

// BEFORE
// Count existing number of forms with a paragraph field
db.forms.countDocuments({
  form_fields: {
    $elemMatch: {
        fieldType: 'statement' // Paragraph field uses StatementFieldBase
    }
  },
})

// UPDATE
// npm install -D marked
// const marked = require("<PATH>/FormSG/node_modules/marked")
function transformAndSave() {
    const documents = db.forms.find({ 'form_fields.fieldType': 'statement' }).toArray();

    // Transform the 'description' field using marked
    const transformedDocuments = documents.map(doc => {
      doc.form_fields = doc.form_fields.map(field => {
        if (field.fieldType === 'statement') {
          // Add two whitespaces in front of every \n to form line breaks as expected
          const markdown = field.description.replace(/\n/g, "  \n");
          field.description = marked.parse(markdown);
        }
        return field;
      });
      return doc;
    });

    for (const doc of transformedDocuments) {
      db.forms.updateOne({ _id: doc._id }, { $set: { form_fields: doc.form_fields } });
    }
}

transformAndSave();

// AFTER
// Count number of forms with a paragraph field
db.forms.countDocuments({
  form_fields: {
      $elemMatch: {
          fieldType: 'statement' // Paragraph field uses StatementFieldBase
      }
  },
})