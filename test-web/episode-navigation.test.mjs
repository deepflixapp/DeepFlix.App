import test from 'node:test';
import assert from 'node:assert/strict';
import '../web/episode-navigation.js';
const episodes=globalThis.DeepflixEpisodes;
const seasons=[{season_number:1,episode_count:3,episode_numbers:[1,3]},{season_number:2,episode_count:8,episode_numbers:[4,8]}];
test('episode navigation skips unavailable numbers and crosses seasons using real availability',()=>{
  assert.deepEqual(episodes.step(seasons,1,1,1),{season:1,episode:3});
  assert.deepEqual(episodes.step(seasons,1,3,1),{season:2,episode:4});
  assert.deepEqual(episodes.step(seasons,2,4,-1),{season:1,episode:3});
  assert.deepEqual(episodes.first(seasons,2),{season:2,episode:4});
  assert.equal(episodes.step(seasons,2,8,1),null);assert.equal(episodes.step(seasons,1,1,-1),null);
});
test('season episode_count cannot invent chapters when no provider numbers exist',()=>{
  assert.deepEqual(episodes.available([{season_number:1,episode_count:50}]),[]);
  assert.equal(episodes.first([{season_number:1,episode_count:50}],1),null);
});
