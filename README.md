# DEEPFLIX Mobile & Android TV App

Aplicativo nativo compilado com Flutter com arquitetura **100% client-side** (sem dependência de servidor Node.js backend).

---

## Recursos Implementados

1. **Standalone (Zero Backend):**
   - Faz o parsing direto dos arquivos XML dos Gists (Filmes, Séries, Canais, Doramas, etc.).
   - Integração com a API do TMDB em tempo real direto do dispositivo.

2. **Perfis Locais & Sem Cadastro:**
   - Criação e alternância de perfis sem formulários na internet.
   - Histórico ("Continuar Assistindo") e favoritos salvos separadamente por perfil no storage local.

3. **Multi-Dispositivo (TV, Celular, Tablet):**
   - Suporte completo a navegação D-pad / controle remoto para Android TV (`TvFocusable`).
   - `android.software.leanback` com suporte no `AndroidManifest.xml`.
   - Layout responsivo por toque em celulares e tablets.

4. **Divisão de Modos na Entrada:**
   - Escolha direta entre **TV Ao Vivo** e **Streaming** logo após o perfil.

5. **Google Cast (Chromecast):**
   - Botão de transmissão integrado na barra superior e no player de vídeo para enviar o stream para TVs pela rede Wi-Fi local.

---

## Como Compilar o App

### Android (TV, Celular, Tablet)
```powershell
flutter build apk --release
```

### Windows
```powershell
flutter build windows --release
```

### Linux
```bash
flutter build linux --release
```

### macOS
```bash
flutter build macos --release
```
