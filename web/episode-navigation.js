(function(global){
  function available(seasons=[]) {
    const result=[];
    for(const season of [...seasons].sort((a,b)=>a.season_number-b.season_number)) {
      const number=Number(season.season_number);if(!Number.isInteger(number) || number<1)continue;
      for(const episode of [...new Set((season.episode_numbers || []).map(Number))].sort((a,b)=>a-b))if(Number.isInteger(episode) && episode>0)result.push({season:number,episode});
    }
    return result;
  }
  function step(seasons,season,episode,direction) {
    const list=available(seasons);if(direction<0)list.reverse();
    return list.find(item=>direction<0?item.season<season || (item.season===season && item.episode<episode):item.season>season || (item.season===season && item.episode>episode)) || null;
  }
  function first(seasons,season=null) {return available(seasons).find(item=>season===null || item.season===Number(season)) || null;}
  global.DeepflixEpisodes={available,step,first};
})(globalThis);
