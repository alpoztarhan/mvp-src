Image bilgisinden pose bilgisini çıkaran veri hazırlama uygulaması


İşlem adımları

1 Tensorflow initialize.

2 Her image dosyası için pose bilgisinin yazıldığı 
birer json dosyası oluşturulur.

3 Bu json dosyaları birleştirilerek sumdata.json dosyası oluşturulur. 

4 Sumdata.json dosyası bir sonraki model training uygulamasında train verisi(inputs) olarak kullanılacaktır.