"use client";

import { Card, Divider, Layout, Typography } from "antd";
import styles from "./PolicyPage.module.css";

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

export default function PolicyPageClient() {
  return (
    <Layout className={styles.layout}>
      <Content className={styles.content}>
        <Card className={styles.card}>
          <div className={styles.cardBody}>
            <Title level={2} className={styles.mainTitle}>
              Xidmət Şərtləri və Məxfilik Siyasəti
            </Title>
            <Text type="secondary">Son yenilənmə: Fevral 2026</Text>

            <Divider />

            <Title level={4}>Ümumi qeyd</Title>
            <Paragraph>
              Bu məxfilik siyasəti, ASİMOS tətbiqində şəxsi məlumatların toplanması,
              saxlanması və istifadəsi prosedurlarını izah edir. ASİMOS tətbiqində
              məlumatların toplanması yalnız platformanın funksional fəaliyyətinin
              təmin edilməsi məqsədi daşıyır.
            </Paragraph>
            <Paragraph>
              Toplanan məlumatlar elan səhifəsində avtomatik dərc edilmir və yalnız
              istifadəçinin əvvəlcədən verdiyi açıq razılıq əsasında üçüncü şəxslər
              üçün əlçatan olur.
            </Paragraph>

            <Divider />

            <Title level={4}>1. Ümumi müddəalar</Title>
            <Paragraph>
              Bu Xidmət Şərtləri ("Şərtlər") ASİMOS mobil tətbiqindən ("Platforma",
              "App", "biz") istifadə edən bütün şəxslər üçün məcburidir.
            </Paragraph>
            <Paragraph>
              Platformadan istifadə etməklə siz:
              <ul>
                <li>bu Şərtlərlə tam və qeyd-şərtsiz razılaşırsınız;</li>
                <li>ən azı 18 yaşınızın olduğunu təsdiqləyirsiniz;</li>
                <li>
                  təqdim etdiyiniz məlumatların doğru, aktual və sizə aid olduğunu
                  qəbul edirsiniz.
                </li>
              </ul>
            </Paragraph>
            <Paragraph>
              İstifadəçi platformadan yalnız öz razılığı və öz riski ilə istifadə
              etdiyini qəbul edir. Əgər bu Şərtlərlə razı deyilsinizsə,
              Platformadan istifadə etməməlisiniz.
            </Paragraph>
            <Paragraph>
              Bu Razılaşma ictimai ofertadır və istifadəçi tərəfindən "təsdiqləmə"
              bölməsi işarələndiyi andan hüquqi qüvvəyə minir.
            </Paragraph>

            <Divider />

            <Title level={4}>2. Platformanın mahiyyəti</Title>
            <Paragraph>
              ASİMOS işəgötürənlərlə işaxtaranlar arasında əlaqənin qurulması, iş
              elanlarının yerləşdirilməsi və müraciətlərin qəbul edilməsi üçün
              yaradılmış rəqəmsal platformadır.
            </Paragraph>
            <Paragraph>
              ASİMOS:
              <ul>
                <li>işəgötürən və işaxtaran arasında bağlanan razılaşmaların tərəfi deyil;</li>
                <li>əmək münasibətlərinə nəzarət və müdaxilə etmir;</li>
                <li>işin icrasına, maaşa, iş saatına və şəraitinə zəmanət vermir;</li>
                <li>işədüzəltmə xidməti kimi fəaliyyət göstərmir;</li>
                <li>tərəflər arasında yaranan mübahisələrə görə məsuliyyət daşımır.</li>
              </ul>
            </Paragraph>

            <Divider />

            <Title level={4}>3. İstifadəçi növləri</Title>
            <Title level={5} className={styles.tightTitle}>İş axtaran</Title>
            <Paragraph>
              <ul>
                <li>Elan yerləşdirə bilməz;</li>
                <li>Profil yarada və elanlara müraciət edə bilər;</li>
                <li>Yerləşdirdiyi şəxsi məlumatların doğruluğuna görə tam məsuliyyət daşıyır.</li>
              </ul>
            </Paragraph>

            <Title level={5} className={styles.tightTitle}>İşəgötürən</Title>
            <Paragraph>
              <ul>
                <li>İş elanı yerləşdirə bilər;</li>
                <li>Elan və əlaqə məlumatlarının doğruluğuna görə tam məsuliyyət daşıyır.</li>
              </ul>
            </Paragraph>

            <Divider />

            <Title level={4}>4. Qeydiyyat və hesab təhlükəsizliyi</Title>
            <Paragraph>
              İstifadəçi:
              <ul>
                <li>yalnız özünə aid, düzgün və tam məlumat təqdim etməlidir;</li>
                <li>saxta, yanlış və ya üçüncü şəxsə aid məlumat paylaşmamalıdır;</li>
                <li>hesabının təhlükəsizliyinə (parol, giriş) görə özü məsuliyyət daşıyır.</li>
              </ul>
            </Paragraph>
            <Paragraph>
              ASİMOS platformanın fəaliyyətinə xələl gətirə biləcək hesabları
              təhlükəsizlik məqsədilə müvəqqəti və ya daimi bloklaya bilər.
            </Paragraph>

            <Divider />

            <Title level={4}>5. Elanlar və profillər</Title>
            <Paragraph>
              İşəgötürən elanda paylaşdığı məlumatların doğruluğuna görə tam
              məsuliyyət daşıyır. İşaxtaran profilində təqdim etdiyi məlumatların
              düzgünlüyünə görə özü cavabdehdir.
            </Paragraph>
            <Paragraph>
              ASİMOS istifadəçilər tərəfindən yerləşdirilən məlumatları yoxlamır,
              onların doğruluğuna zəmanət vermir və bu məlumatlara görə məsuliyyət
              daşımır.
            </Paragraph>
            <Paragraph>
              Platforma istənilən elanı və ya profili uyğunsuz hərəkət aşkar etdikdə
              səbəb göstərmədən silə və ya bloklaya bilər.
            </Paragraph>

            <Divider />

            <Title level={4}>6. Qadağan olunmuş fəaliyyətlər</Title>
            <Paragraph>
              Platformada aşağıdakı hərəkətlər qadağandır:
              <ul>
                <li>saxta elan və profillər yaratmaq;</li>
                <li>başqasını təqlid etmək;</li>
                <li>başqa birinin məlumatlarını bölüşmək;</li>
                <li>qanunsuz iş təklifləri;</li>
                <li>ayrı-seçkilik, təhqir, böhtan;</li>
                <li>spam və reklam məqsədli fəaliyyət;</li>
                <li>istifadəçilərin məlumatlarını icazəsiz toplamaq və paylaşmaq;</li>
                <li>platformadan kənar işədüzəltmə xidmətləri kimi istifadə etmək;</li>
                <li>platformanın texniki təhlükəsizliyinə müdaxilə cəhdləri.</li>
              </ul>
            </Paragraph>

            <Divider />

            <Title level={4}>7. Ödənişlər</Title>
            <Paragraph>
              Vacib qeyd:
              <ul>
                <li>ASİMOS platformasında bütün xidmətlər tam ödənişsizdir;</li>
                <li>heç bir halda ödəniş, komissiya və ya xidmət haqqı tələb edilmir;</li>
                <li>Platforma maliyyə münasibətlərində iştirak etmir.</li>
              </ul>
            </Paragraph>

            <Divider />

            <Title level={4}>8. Məsuliyyətin məhdudlaşdırılması</Title>
            <Title level={5} className={styles.tightTitle}>8.1. Platformanın vasitəçi statusu</Title>
            <Paragraph>
              ASİMOS yalnız istifadəçiləri əlaqələndirən texnoloji vasitədir və
              işə qəbul prosesi, əmək münasibətləri, maaş ödənişləri, iş şəraiti,
              iş saatları və mübahisələrə görə hüquqi və maliyyə məsuliyyəti daşımır.
            </Paragraph>

            <Title level={5} className={styles.tightTitle}>8.2. İstifadəçilər arasında əlaqə</Title>
            <Paragraph>
              ASİMOS istifadəçilər arasında ünsiyyət, görüş, danışıqlar və
              razılaşmalara görə məsuliyyət daşımır. Müraciət zamanı irəli sürülən
              şəxsi maliyyə tələbləri platformanın nəzarətindən kənardır.
            </Paragraph>
            <Paragraph>
              Platforma yalnız tərəflərin əlaqə məlumatını təqdim edir və nəticəyə,
              razılaşmalara, ödəniş proseslərinə qarışmır. İstifadəçilər öz
              təhlükəsizliklərinə özləri cavabdehdirlər.
            </Paragraph>

            <Divider />

            <Title level={4}>9. Məxfilik siyasəti</Title>
            <Title level={5} className={styles.tightTitle}>9.1. Məlumatların toplanması</Title>
            <Paragraph>
              Qeydiyyat zamanı toplana bilən məlumatlar:
              <ul>
                <li>Ad, e-poçt, telefon nömrəsi, iş təcrübəsi.</li>
                <li>İşəgötürənlər üçün: şirkət adı, əlaqə məlumatları, elan detalları.</li>
              </ul>
            </Paragraph>

            <Title level={5} className={styles.tightTitle}>9.2. Məlumatların istifadəsi</Title>
            <Paragraph>
              Məlumatlar yalnız:
              <ul>
                <li>işəgötürənlə işaxtaranın əlaqələndirilməsi;</li>
                <li>platformanın texniki işinin düzgün işləməsinin təmin edilməsi</li>
              </ul>
              məqsədləri üçün istifadə olunur.
            </Paragraph>

            <Title level={5} className={styles.tightTitle}>9.3. Məlumatların paylaşılması</Title>
            <Paragraph>
              <ul>
                <li>Məlumatlar üçüncü tərəflərə satılmır;</li>
                <li>yalnız istifadəçinin razılığı ilə paylaşılır;</li>
                <li>qanuni tələb olduqda dövlət orqanlarına təqdim edilə bilər.</li>
              </ul>
            </Paragraph>

            <Divider />

            <Title level={4}>10. İstifadəçi hüquqları</Title>
            <Paragraph>
              İstifadəçi:
              <ul>
                <li>öz məlumatlarına baxa;</li>
                <li>düzəliş edə;</li>
                <li>silinməsini tələb edə;</li>
                <li>verdiyi razılığı geri götürə bilər.</li>
              </ul>
            </Paragraph>

            <Divider />

            <Title level={4}>11. Yaş məhdudiyyəti</Title>
            <Paragraph>
              Platforma 18 yaşdan kiçik şəxslər üçün nəzərdə tutulmayıb və bu
              kateqoriyaya aid məlumatlar ümumiyyətlə toplanmır.
            </Paragraph>

            <Divider />

            <Title level={4}>12. Dəyişikliklər</Title>
            <Paragraph>
              ASİMOS bu Şərtləri istənilən vaxt yeniləmək hüququnu saxlayır.
              Yenilənmiş versiya tətbiqdə dərc edildiyi andan qüvvəyə minir.
            </Paragraph>

            <Divider />

            <Title level={4}>13. Qanunvericilik və mübahisələr</Title>
            <Paragraph>
              Bu Şərtlər Azərbaycan Respublikasının qanunvericiliyinə əsaslanır.
              Mübahisələr ilkin olaraq danışıqlar yolu ilə, mümkün olmadıqda məhkəmə
              qaydasında həll edilir.
            </Paragraph>

            <Divider />

            <Title level={4}>14. Texniki fasilələr və fors-major hallar</Title>
            <Paragraph>
              ASİMOS texniki nasazlıqlar, server problemləri, internet kəsintiləri,
              proqram yeniləmələri və ya nəzarətimizdən kənar səbəblər nəticəsində
              platformanın müvəqqəti işləməməsinə görə məsuliyyət daşımır.
            </Paragraph>

            <Divider />

            <Title level={4}>15. Əlaqə</Title>
            <Paragraph>
              <Text strong>📧 </Text>
              <a href="mailto:asimos.org@gmail.com">asimos.org@gmail.com</a>
            </Paragraph>
          </div>
        </Card>
      </Content>
    </Layout>
  );
}
