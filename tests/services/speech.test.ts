import {test, testModule} from "../qunit";
import {isSideEffect, serviceOutputs, SideEffect} from "kamo-reducers/reducers";
import {BufferedSubject, Subscription} from "kamo-reducers/subject";
import {findVoiceForLanguage, LoadVoices, requestSpeech, withSpeech} from "../../src/services/speech";
import {LanguageSettings} from "../../src/model";

let subscription = new Subscription();

testModule("services/speech", {
  afterEach: () => {
    subscription.unsubscribe();
  }
});

test("speech", (assert) => {
  // let effect$ = new BufferedSubject<SideEffect>();
  // // let finish = assert.async();
  //
  // // assert.timeout(30000);
  //
  //
  // subscription.add(serviceOutputs(effect$, [withSpeech]).subscribe((ea) => {
  //   if (!isSideEffect(ea)) {
  //     if (ea.type === "load-voices") {
  //       let loadVoices = ea as LoadVoices;
  //       let voices = loadVoices.voices;
  //       assert.ok(voices.length);
  //       //
  //       // setTimeout(() => {
  //       //   let voice = findVoiceForLanguage(voices, LanguageSettings["English"].codes);
  //       //   assert.ok(voice);
  //       //   if (voice) {
  //       //     effect$.dispatch(requestSpeech(voice, "Hello World!"));
  //       //   }
  //       // }, 10);
  //       //
  //       // setTimeout(() => {
  //       //   let voice = findVoiceForLanguage(voices, LanguageSettings["Japanese"].codes);
  //       //   assert.ok(voice);
  //       //   if (voice) {
  //       //     effect$.dispatch(requestSpeech(voice, "こんにちわ"));
  //       //   }
  //       // }, 5000);
  //       //
  //       // setTimeout(() => {
  //       //   let voice = findVoiceForLanguage(voices, LanguageSettings["Cantonese"].codes);
  //       //   assert.ok(voice);
  //       //   if (voice) {
  //       //     // TODO HERE
  //       //     effect$.dispatch(requestSpeech(voice, ""));
  //       //   }
  //       // }, 10000);
  //       //
  //       // setTimeout(finish, 15000);
  //     }
  //   }
  // }));
});