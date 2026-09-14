/**
 * Right padding for the control nested inside a respondent option.
 *
 * The three options each render a field underneath their radio label, and the
 * radio indents that field on the left by its own 0.5rem gutter, the 1.5rem
 * control and the 0.5rem of label spacing. Nothing balances it on the right,
 * where the 0.5rem gutter is all that stands between a full-width field and
 * the edge of the step card, so the field reads as flush with the card rather
 * than as sitting inside the option. Most visible on the tag input under
 * "Specific emails", which is the widest of the three.
 *
 * Deliberately not the full left indent. Matching it would look deliberate but
 * costs 2.5rem of a viewport that has already spent 88px of a phone's 320 on
 * page gutters, card padding and the radio itself.
 */
export const NESTED_CONTROL_PR = '1rem'
