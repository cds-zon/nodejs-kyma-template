 #!/bin/bash

# install pnpm

npm install -g pnpm@latest

pnpm install


# install dotnet
curl -L https://dot.net/v1/dotnet-install.sh -o dotnet-install.sh
chmod +x dotnet-install.sh
./dotnet-install.sh --version latest
source /home/ubuntu/.bashrc

dotnet --list-sdks
dotnet --list-runtimes

# install aspire
curl -sSL https://aspire.dev/install.sh -o aspire-install.sh 
chmod +x aspire-install.sh
./aspire-install.sh  --install-extension   #   --quality dev  --install-path "~/bin"
source /home/ubuntu/.bashrc

aspire --version

# bind cds env
cp $ROOT_WORKTREE_PATH/.kube/config  ~/.kube/config
cp $ROOT_WORKTREE_PATH/.cdsrc-private.json  .cdsrc-private.json
pnpm bind:resolve

