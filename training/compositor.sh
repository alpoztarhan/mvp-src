sudo docker compose down
sudo docker compose build
# sudo docker compose up -d
#sudo DOCKER_BUILDKIT=0 docker-compose up --build -d
#docker exec -it $(docker ps -aqf name=nodejsml-mltelefit-1) bash
#docker exec -it $(docker ps -aqf name=training-mltelefit-1) bash
sudo docker compose up
sudo docker compose logs

