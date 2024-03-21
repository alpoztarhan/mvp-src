clear
sudo docker compose down --remove-orphans
sudo docker compose build
sudo docker compose up 
#sudo DOCKER_BUILDKIT=0 docker-compose up --build -d
sudo docker compose logs