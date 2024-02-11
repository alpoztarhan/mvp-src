#sudo docker build -t memex .
#sudo docker run -p 8080:8080 memex

#portu dinleyen prosesler
#lsof  -i tcp:8080
#lsof  -i tcp:27017

#portu dinleyen prosesleri kill et
#kill -9 $(lsof -t -i tcp:8080)
#kill -9 $(lsof -t -i tcp:27017)

# Remove all containers
#docker rm -fv $(docker ps -aq)

# List who's using the port
#sudo lsof -i -P -n | grep <port number>  
#sudo lsof -i -P -n | grep 8080  
#sudo lsof -i -P -n | grep 27017  

# sudo kill <process id>

# sudo aa-remove-unknown

#sudo systemctl restart docker
#sudo systemctl restart docker.service


#hepsi olmazsa adamın aklını alırlar bu kesin container killer
#docker exec -it id_container /bin/bash
#docker exec -it $(docker ps -aq) /bin/bash # bunu tekilleştirebilirsen çalışır
#docker exec -it $(docker ps -aq) kill 1
# docker ps -f name=foo
# docker ps -f name=nodejs-memex
#docker exec -it $(docker ps -aqf name=nodejs-memex) kill 1
#docker exec -it $(docker ps -aqf name=mongodb_memex) kill 1




#bu kesin image killer
# sudo systemctl stop docker
# sudo rm -rf /var/lib/docker
# sudo systemctl start docker



echo durdurulacak containerlar
echo $(docker ps --format 'ID:{{.ID}}\\t imaj:{{.Image}}\\t durum:{{.Status}}\\t Name:{{.Names}}' -af name=nodejs-memex)
echo $(docker ps --format 'ID:{{.ID}}\\t imaj:{{.Image}}\\t durum:{{.Status}}\\t Name:{{.Names}}' -af name=mongodb_memex)
echo $(docker ps --format 'ID:{{.ID}}\\t imaj:{{.Image}}\\t durum:{{.Status}}\\t Name:{{.Names}}' -af name=memex-memex-1)
sleep 2

echo exec ile durdurma deneniyor
sudo docker exec -it $(docker ps -aqf name=nodejs-memex) kill 1
sudo docker exec -it $(docker ps -aqf name=mongodb_memex) kill 1
sudo docker exec -it $(docker ps -aqf name=memex-memex-1) kill 1
sleep 2



echo stop ile durdurma deneniyor
sudo docker stop $(docker ps -a --filter name=nodejs-memex -q)
sudo docker stop $(docker ps -a --filter name=mongodb_memex -q)
sudo docker stop $(docker ps -a --filter name=memex-memex-1 -q)
sleep 2

echo exec ile durdurma deneniyor
sudo docker exec -it $(docker ps -aqf name=nodejs-memex) kill 1
sudo docker exec -it $(docker ps -aqf name=mongodb_memex) kill 1
sudo docker exec -it $(docker ps -aqf name=memex-memex-1) kill 1
sleep 2

echo kill ile durdurma deneniyor
sudo docker kill $(docker ps -a --filter name=nodejs-memex -q)
sudo docker kill $(docker ps -a --filter name=mongodb_memex -q)
sudo docker kill $(docker ps -a --filter name=memex-memex-1 -q)
sleep 2

echo exec ile durdurma deneniyor
sudo docker exec -it $(docker ps -aqf name=nodejs-memex) kill 1
sudo docker exec -it $(docker ps -aqf name=mongodb_memex) kill 1
sudo docker exec -it $(docker ps -aqf name=memex-memex-1) kill 1
sleep 2

echo rm ile durdurma deneniyor
sudo docker rm $(docker ps -a --filter name=nodejs-memex -q)
sudo docker rm $(docker ps -a --filter name=mongodb_memex -q)
sudo docker rm $(docker ps -a --filter name=memex-memex-1 -q)
sleep 2

echo exec ile durdurma deneniyor
sudo docker exec -it $(docker ps -aqf name=nodejs-memex) kill 1
sudo docker exec -it $(docker ps -aqf name=mongodb_memex) kill 1
sudo docker exec -it $(docker ps -aqf name=memex-memex-1) kill 1
sleep 2



echo durdurma sonrası denetim
echo $(docker ps --format 'ID:{{.ID}}\\t imaj:{{.Image}}\\t durum:{{.Status}}\\t Name:{{.Names}}' -af name=mongodb_memex)
echo $(docker ps --format 'ID:{{.ID}}\\t imaj:{{.Image}}\\t durum:{{.Status}}\\t Name:{{.Names}}' -af name=nodejs-memex)
echo $(docker ps --format 'ID:{{.ID}}\\t imaj:{{.Image}}\\t durum:{{.Status}}\\t Name:{{.Names}}' -af name=nodejs-memex)


sudo docker compose down --remove-orphans
sudo docker compose build
sudo docker compose up -d
sudo docker compose logs
