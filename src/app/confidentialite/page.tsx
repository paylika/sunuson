import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";
import { DocumentLegal, Section } from "@/components/document-legal";
import { Shell } from "@/components/shell";

export const metadata: Metadata = {
  title: `Politique de confidentialité — ${APP_NAME}`,
};

export default function ConfidentialitePage() {
  return (
    <Shell>
      <DocumentLegal titre="Confidentialité" maj="19 août 2026">
        <Section titre="Écouter ne demande rien">
          <p>
            Tu peux écouter tous les sons et soutenir un artiste{" "}
            <strong className="text-fg/85">sans créer de compte</strong>. Nous
            ne te demandons ni ton nom, ni ton numéro, ni ton adresse pour ça.
          </p>
        </Section>

        <Section titre="Ce que nous gardons, et pourquoi">
          <p>
            <strong className="text-fg/85">Si tu crées un compte :</strong> ton
            adresse électronique, pour te reconnaître. Le nom et la photo que
            tu choisis, s&apos;affichent là où tu apparais. Ta playlist reste
            dans ton téléphone, pas chez nous.
          </p>
          <p>
            <strong className="text-fg/85">Si tu soutiens un artiste :</strong>{" "}
            le nom que tu donnes à ce moment-là, le montant, le moyen de
            paiement et la date. L&apos;artiste voit ton nom et ton message ;{" "}
            <strong className="text-fg/85">jamais le montant</strong>, qui
            n&apos;est affiché publiquement nulle part.
          </p>
          <p>
            <strong className="text-fg/85">Si tu es artiste :</strong> ton nom
            d&apos;artiste, ton Foy Tewal, ta présentation, tes images, et ton
            numéro de retrait. Ce numéro sert uniquement à te payer et{" "}
            <strong className="text-fg/85">
              n&apos;apparaît sur aucune page publique
            </strong>{" "}
            — c&apos;est la raison d&apos;être de cette plateforme.
          </p>
          <p>
            <strong className="text-fg/85">Les écoutes</strong> sont comptées
            sans être rattachées à qui que ce soit. Nous savons qu&apos;un
            morceau a été écouté, pas par qui.
          </p>
        </Section>

        <Section titre="Ce que nous ne faisons pas">
          <p>
            Nous ne vendons aucune donnée. Nous ne faisons pas de publicité
            ciblée. Nous n&apos;installons pas de traceurs publicitaires.
          </p>
        </Section>

        <Section titre="Qui d'autre voit tes données">
          <p>
            Seulement ceux sans qui le service ne fonctionne pas : notre
            hébergeur, notre base de données, et l&apos;opérateur mobile qui
            traite le paiement quand tu soutiens quelqu&apos;un. Chacun n&apos;en
            voit que ce dont il a besoin.
          </p>
        </Section>

        <Section titre="Combien de temps">
          <p>
            Tant que ton compte existe. Les traces de paiement sont conservées
            plus longtemps quand la loi comptable l&apos;exige — un versement
            d&apos;argent doit rester traçable.
          </p>
        </Section>

        <Section titre="Effacer ton compte">
          <p>
            Depuis tes réglages, en bas de l&apos;écran. C&apos;est immédiat et
            définitif.
          </p>
          <p>
            Si tu es artiste, ta page, tes sons et tes projets partent avec.
            Retire ton argent avant : nous refusons la suppression tant
            qu&apos;un solde reste dû.
          </p>
          <p>
            Les soutiens que tu as envoyés à des artistes restent chez eux,
            mais détachés de ton compte : ton nom n&apos;y est plus rattaché.
            Ce que quelqu&apos;un a reçu ne doit pas s&apos;effacer parce
            qu&apos;un autre s&apos;en va.
          </p>
        </Section>

        <Section titre="Tes droits">
          <p>
            Tu peux demander à voir ce que nous avons sur toi, le faire
            corriger, ou le faire effacer. Écris-nous et nous répondons sous
            trente jours.
          </p>
        </Section>

        <Section titre="Nous écrire">
          <p>contact@{APP_NAME.toLowerCase()}.app</p>
        </Section>
      </DocumentLegal>
    </Shell>
  );
}
