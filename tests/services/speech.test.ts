import {test, testModule} from "../qunit";
import {serviceOutputs, SideEffect} from "kamo-reducers/reducers";
import {Subject, Subscription} from "kamo-reducers/subject";
import {requestSpeech, withSpeech} from "../../src/services/speech";

let subscription = new Subscription();

testModule("services/speech", {
  afterEach: () => {
    subscription.unsubscribe();
  }
});

const timePerVoice = 1500;

test("speech", (assert) => {
  let effect$ = new Subject<SideEffect>();
  let finish = assert.async();

  assert.timeout(30000);

  assert.ok(true);

  subscription.add(serviceOutputs(effect$, [withSpeech]).subscribe(() => 0));
  setTimeout(() => {
    effect$.dispatch(requestSpeech("Hello World!", "English"));
  }, 10);

  setTimeout(() => {
    effect$.dispatch(requestSpeech("こんにちわ", "Japanese"));
  }, timePerVoice);

  setTimeout(() => {
    effect$.dispatch(requestSpeech("好耐冇見", "Cantonese"));
  }, timePerVoice * 2);

  setTimeout(finish, timePerVoice * 3);
});