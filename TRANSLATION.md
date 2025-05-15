## **Contributing to FormSG Translations**

Thank you for your interest in helping with translations! FormSG uses i18next and react-i18next to provide a localized experience across different languages. This guide will help you understand how our translation system works and how to contribute effectively.

## **Translation Framework**

FormSG uses the following i18n libraries:

- [**i18next**](https://github.com/i18next/i18next): Core internationalization framework
- [**react-i18next**](https://react.i18next.com/): React bindings for i18next
- [**i18next-icu**](https://react.i18next.com/misc/using-with-icu-format): Support for ICU message pluralization format

To make a text available for translation, it needs to be "externalized" first. Externalization is when you replace hardcoded English text in your code with function calls that fetch the appropriate translated version based on the user's selected language.

Our approach is hook-based, where we use the `useTranslation` hook to access and render translated strings:

```typescript
import { useTranslation } from 'react-i18next'

const MyComponent = () => {
  // Get the translation function with the correct namespace
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.form',
  })

  // Use the translation function to render strings
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      <button>{t('buttons.submit')}</button>
    </div>
  )
}
```

This approach allows us to:

- Keep UI components clean and maintainable
- Change languages dynamically without component remounting
- Access translations anywhere in the component tree
- Leverage TypeScript for type safety in translation keys

## **Translation Structure**

Our translations are organized using a hierarchy of TypeScript files. We use a type-safe approach to ensure all translations are properly structured and complete.

### Directory Structure
```
frontend/src/i18n/locales/

├── features/           # Feature-specific translations
│   ├── app/            # Application-wide UI elements
│   ├── public-form/    # Public form UI elements
│   │   └── fields/     # Field-specific UI translations
│   └── ...
├── utils/              # Utility-related translations
│   ├── field-validation/  # Field validation errors
│   └── ...
```

### Translation Files

Each translation namespace has at least:

1. An `index.ts` file that defines the type structure
2. Language-specific files (e.g., `en-sg.ts`, `zh-sg.ts`) that implement the structure

Example:

```typescript
// index.ts - defines the structure

export interface FieldValidation {
  required: string;
  invalidEmail: string;
  // ...
}

// en-sg.ts - implements the structure for English
export const enSG: FieldValidation = {
  required: 'This field is required',
  invalidEmail: 'Please enter a valid email',
  // ...
};
```

## **Forking FormSG for Your Country or Agency**

If you are forking FormSG for use in another country or government agency, here are some specific guidelines:

### Setting Up Your Locale

1. **Determine Your Locale Code**: Use standard locale codes like `en-us` (English-US), `fr-fr` (French-France), etc.
2. **Create Base Locale Files**:
    - Create new locale files in each translation directory (e.g., `fr-fr.ts`)
    - Start by copying the English version and translating each string
3. **Register Your Locale**:
    - Add your locale to the language options in i18n.ts
    - Configure the language detection and fallback options
4. **Update Default Locale** (if needed):
    - Change the default locale in your configuration to match your country

### Country-Specific Customizations

Beyond translation, you may want to customize:

- **Address Formats**: Different countries use different address formats
- **Phone Number Validation**: Update validation rules to match your country's format
- **Date Formats**: Update date formats to match your country's standards
- **Currency Symbols**: Update currency symbols and formats if applicable

### Testing Your Localization

- Test your translated version across all major features
- Pay special attention to form validation messages
- Ensure that all dynamic content (dates, times, numbers) is properly formatted
- Verify that layout and spacing work correctly with your translations

## **Adding Translations for a New Language**

To add support for a new language:

1. Create a new file in each translation directory named after the language code (e.g., `ja-jp.ts` for Japanese)
2. Implement all the required interfaces from the corresponding `index.ts`
3. Register the language in i18n.ts

For example, to add French translations:

```typescript
// fr-fr.ts
export const frFR: FieldValidation = {
  required: 'Ce champ est obligatoire',
  invalidEmail: 'Veuillez entrer une adresse email valide',
  // ...
};
```

## **Recommended Development Tools**

To improve your translation workflow, we recommend installing these VS Code extensions:

### [Error Lens](https://marketplace.visualstudio.com/items?itemName=usernamehw.errorlens)

Error Lens enhances your coding experience by highlighting errors and warnings in-line, making it easier to spot missing or incorrect translations.

### [i18n-ally](https://github.com/lokalise/i18n-ally)

i18n-ally is extremely helpful when working with translations:

- Shows translation status for each key
- Allows easy navigation between translation files
- Provides inline previews of translations
- Highlights missing translations

These tools are optional but highly recommended for a better translation development experience.

## **Updating Existing Translations**

When updating existing translations:

1. Locate the appropriate translation file in the directory structure
2. Make your changes while maintaining the type structure
3. Ensure you update all language files for consistency

## **Translation Guidelines**

### Do:

- Keep translations concise and clear
- Maintain consistency in terminology across the application
- Use correct grammar and punctuation
- Consider context and space constraints
- Test your translations in the UI to ensure they display correctly

### Don't:

- Translate technical terms unless there's an established translation
- Add new fields without updating the interface in `index.ts`
- Modify the structure of the translation objects

## **Testing Your Translations**

After making changes to translation files:

1. Run `npm run build` to ensure there are no TypeScript errors
2. Switch to your language in the application UI to verify your translations
3. Check that formatting and layout work correctly with your translations

## **Translation Variables**

Some translations include variables that are replaced at runtime. These are denoted with curly braces:

```
Please enter at least {threshold} characters ({current}/{threshold})
```

Make sure to preserve these variables in your translations.

## **Pluralization**

For translations that may require different forms for singular and plural, use the ICU message format:

```
{count, plural, =1{# item} other{# items}}
```

## **Getting Help**

If you have any questions or need guidance, please:

- Open an issue
- Reach out to the project maintainers
- Check the existing translations for reference

Thank you for helping make FormSG accessible to more users around the world!
