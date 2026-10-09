import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults } from '../lib/profile';
import { newAnswers, stageError } from '../components/PersonalizationSteps';
import { exerciseScreenKeys, foodScreenKeys, selectSafetyGroup, selectInjuryStatus } from '../lib/ai/safety-answers';

function negativeScreen() {
  let a = newAnswers({ ...defaults, startDate: '2026-10-09' });
  a = selectSafetyGroup(a, exerciseScreenKeys, 'none');
  a = selectSafetyGroup(a, foodScreenKeys, 'none');
  return selectInjuryStatus(a, 'none');
}

test('three explicit negative groups complete the screen; initial defaults do not', () => {
  assert.ok(stageError(2, newAnswers({ ...defaults, startDate: '2026-10-09' })));
  assert.equal(stageError(2, negativeScreen()), null);
});

test('No then Yes/unsure reopens unanswered details and cannot silently continue', () => {
  for (const keys of [exerciseScreenKeys, foodScreenKeys]) {
    const old = negativeScreen();
    const reopened = selectSafetyGroup(old, keys, 'details');
    for (const key of keys) assert.ok(!reopened.answered.includes(key));
    assert.ok(stageError(2, reopened), 'Reopened questions must be answered');
    assert.equal(stageError(2, old), null, 'Previous state is not mutated');
    assert.equal(stageError(2, selectSafetyGroup(reopened, keys, 'none')), null);
  }
});

test('reopening never erases an affirmative restriction or uncertainty', () => {
  const old = negativeScreen();
  old.safety.medicalExerciseRestriction = 'yes';
  old.safety.exertionalSymptoms = 'unsure';
  const reopened = selectSafetyGroup(old, exerciseScreenKeys, 'details');
  assert.equal(reopened.safety.medicalExerciseRestriction, 'yes');
  assert.ok(reopened.answered.includes('medicalExerciseRestriction'));
  assert.equal(reopened.safety.exertionalSymptoms, 'unsure');
  assert.ok(reopened.answered.includes('exertionalSymptoms'));
  assert.ok(!reopened.answered.includes('urgentSymptoms'));
});

test('a different injury status cannot inherit old confirmed pain/duration answers', () => {
  const old = negativeScreen();
  old.safety.injury.status = 'resolved';
  old.safety.injury.areas = ['hip-groin'];
  old.answered.push('injury.pain', 'injury.duration', 'injury.worsening', 'injury.afterReaction');
  const changed = selectInjuryStatus(old, 'current');
  assert.deepEqual(changed.answered.filter(k => k.startsWith('injury.')), ['injury.status']);
  assert.equal(changed.safety.injury.status, 'current');
  assert.ok(stageError(2, changed));
  assert.equal(old.safety.injury.status, 'resolved');
  assert.equal(selectInjuryStatus(old, 'resolved'), old, 'Selecting the current status is a no-op');
});
