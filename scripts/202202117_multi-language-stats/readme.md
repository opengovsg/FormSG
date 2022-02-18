## Context

Script was written to understand multi-language patterns from fromSG use cases. Specifically requireent from Pearly were:

- how many forms use another language apart from english
- number of submissions for these forms
- what languages are being used
- which agencies primarily
- some examples of these forms would be great
- any other related data you think might be interesting!

Detecting language is hard, especially since many form use multiple language for the same text blocks. Singapore has 4 primary languages, so the script attempt to look for these specifically. Chinese and Tamil are easy to spot thanks to dedicated unicode character ranges. Distinguishing English and Malay is harder, so the script uses a very crude heuristic to locate words from these languages that we expect to see in forms.

Anything with no match is categorized as `unknown`, and is likely English with funky words, like [this form](https://form.gov.sg/#!/5e0c9534df378700118f3349).

The scripts output some form count overall by language, and then generates more details reports (with agency name, and number of submissions) for 2 categories:

1. Forms where multiple languages are detected
2. Form where only one language is detected, and it is not English

The results are printed to stdout as TSV content, so they can be copy/pasted into excel of google docs. Example [report here](https://docs.google.com/spreadsheets/d/1WQWmmStSvXJ94-MWzIbHn7RwY8uzTEcXVGMeFn5ozoM/edit?usp=sharing).

## Install and run

```bash
cp .env.template .env.production

# edit .env.production with the correct URU

npm install
npm run get_data
```
