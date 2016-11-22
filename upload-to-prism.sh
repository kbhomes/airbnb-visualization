# Uploads the appropriate data to the GATech Prism service

echo "Enter your Georgia Tech username: "
read username

rm -rf /tmp/fairbnb
mkdir /tmp/fairbnb
cp -a public /tmp/fairbnb
cp -a build /tmp/fairbnb
(cd /tmp && rsync -avz --relative --update fairbnb sanwar7@scp.prism.gatech.edu:public_html/)

