cd client
npm --max-old-space-size=1500 install
node --max_old_space_size=1500 node_modules/.bin/react-scripts build
cd ../server
npm --max-old-space-size=1500 install
npm run build
