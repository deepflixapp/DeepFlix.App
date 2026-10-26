// Per-account local cache and an ordered, durable queue of offline changes.
(function(global) {
  class AccountSync {
    constructor({storage,request,onChange=()=>{}}) {this.storage=storage;this.request=request;this.onChange=onChange;this.user=null;this.running=new Map();}
    read(key,fallback) {try{return JSON.parse(this.storage.getItem(key) || 'null') ?? fallback;}catch{return fallback;}}
    write(key,value) {this.storage.setItem(key,JSON.stringify(value));}
    cacheKey(id=this.user?.id) {return `deepflix_account_${id}_v1`;}
    queueKey(id=this.user?.id) {return `deepflix_pending_${id}_v1`;}
    guest() {return {history:this.read('deepflix_local_history_v1',[]).filter(item=>item?.key && item.kind!=='canais'),favorites:this.read('deepflix_local_favorites_v1',[]).filter(item=>item?.key)};}
    cache(id=this.user?.id) {return id?this.read(this.cacheKey(id),{history:[],favorites:[]}):this.guest();}
    activate(user) {this.user=user;this.write('deepflix_active_account_v1',user);return this.cache();}
    save(collection,list) {
      const clean=(list || []).slice(0,collection==='history'?300:500);
      if(!this.user){this.write(collection==='history'?'deepflix_local_history_v1':'deepflix_local_favorites_v1',clean);return;}
      const cache=this.cache();cache[collection]=clean;this.write(this.cacheKey(),cache);
    }
    pending(id=this.user?.id) {return id?this.read(this.queueKey(id),[]):[];}
    enqueue(path,method,body) {
      const id=this.user?.id;if(!id)return Promise.resolve();
      const queue=this.pending(id),last=queue.at(-1);
      if(method==='POST' && last?.method==='POST' && last.path===path && last.body?.kind===body?.kind && last.body?.itemId===body?.itemId)queue.pop();
      queue.push({id:`${Date.now()}-${Math.random()}`,path,method,body});this.write(this.queueKey(id),queue);this.onChange();
      return this.flush(id);
    }
    flush(id=this.user?.id) {
      if(!id || this.user?.id!==id)return Promise.resolve();
      if(this.running.has(id))return this.running.get(id);
      const task=(async()=>{
        while(this.user?.id===id){
          const operation=this.pending(id)[0];if(!operation)break;
          await this.request(operation.path,{method:operation.method,body:operation.body,accountId:id});
          this.write(this.queueKey(id),this.pending(id).filter(item=>item.id!==operation.id));this.onChange();
        }
      })().finally(()=>this.running.delete(id));
      this.running.set(id,task);return task;
    }
    overlay(cache,operations) {
      for(const operation of operations){
        const url=new URL(operation.path,'https://deepflix.invalid');
        const collection=url.pathname==='/api/history'?'history':'favorites';
        const key=operation.method==='POST'?`${operation.body.kind}:${operation.body.itemId}`:url.searchParams.get('key');
        if(operation.method==='DELETE')cache[collection]=key?cache[collection].filter(item=>item.key!==key):[];
        else cache[collection]=[{...operation.body,key},...cache[collection].filter(item=>item.key!==key)];
      }
      return cache;
    }
    async pull() {
      const id=this.user?.id;if(!id)return this.guest();
      await this.flush(id);
      const [history,favorites]=await Promise.all([
        this.request('/api/history',{accountId:id}),this.request('/api/favorites',{accountId:id}),
      ]);
      if(this.user?.id!==id)return null;
      const cache=this.overlay({history:(history.results || []).filter(item=>item.kind!=='canais'),favorites:favorites.results || []},this.pending(id));
      this.write(this.cacheKey(id),cache);return cache;
    }
    async importGuest() {if(this.user)await this.request('/api/auth/import',{method:'POST',body:this.guest(),accountId:this.user.id});}
  }
  global.DeepflixAccountSync=AccountSync;
})(globalThis);
