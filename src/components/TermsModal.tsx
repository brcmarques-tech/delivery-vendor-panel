"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_CONTRACT_CONTENT } from "@/lib/graphql";

interface TermsModalProps {
  type: "terms" | "subscription";
  onAccept?: () => void;
  onClose?: () => void;
  loading?: boolean;
  readOnly?: boolean;
  userName?: string;
  userCpf?: string;
}

export default function TermsModal({ type, onAccept, onClose, loading, readOnly, userName, userCpf }: TermsModalProps) {
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [checked, setChecked] = useState(false);
  // Map modal type to backend contract type
  const contractType = type === "terms" ? "vendor" : "subscription";
  const { data: customData } = useQuery(GET_CONTRACT_CONTENT, { variables: { type: contractType } });
  const customContent = customData?.contractContent || "";

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
      setScrolledToEnd(true);
    }
  }

  const title = type === "terms"
    ? "Termos de Uso da Plataforma"
    : "Contrato de Assinatura de Plano";

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {readOnly
                ? "Visualiza\u00e7\u00e3o do contrato aceito."
                : type === "terms"
                  ? "Leia atentamente antes de utilizar a plataforma."
                  : "Leia atentamente antes de assinar um plano."}
            </p>
          </div>
          {readOnly && onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition cursor-pointer"
              aria-label="Fechar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div
          className="flex-1 overflow-y-auto p-6 text-sm text-gray-700 leading-relaxed"
          onScroll={handleScroll}
        >
          {(userName || userCpf) && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-500 font-medium mb-2">PARTE CONTRATANTE / ASSINANTE:</p>
              {userName && <p className="text-sm font-semibold text-gray-800">{userName}</p>}
              {userCpf && (
                <p className="text-sm text-gray-600">
                  CPF: {userCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                </p>
              )}
            </div>
          )}
          {customContent
            ? <div className="whitespace-pre-line">{customContent}</div>
            : type === "terms" ? <PlatformTerms /> : <SubscriptionTerms />}
        </div>

        {readOnly ? (
          <div className="p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        ) : (
          <div className="p-6 border-t border-gray-200 space-y-4">
            {!scrolledToEnd && (
              <p className="text-xs text-orange-500 font-medium">
                Role at&eacute; o final do contrato para poder aceitar.
              </p>
            )}

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                disabled={!scrolledToEnd}
                className="mt-0.5 w-5 h-5 accent-orange-500"
              />
              <span className={`text-sm ${scrolledToEnd ? "text-gray-800" : "text-gray-400"}`}>
                {type === "terms"
                  ? "Li e aceito os Termos de Uso da Plataforma, a Pol\u00edtica de Privacidade e estou ciente das minhas responsabilidades como vendedor."
                  : "Li e aceito o Contrato de Assinatura, estou ciente das condi\u00e7\u00f5es de pagamento, renova\u00e7\u00e3o e cancelamento."}
              </span>
            </label>

            <button
              onClick={onAccept}
              disabled={!checked || !scrolledToEnd || loading}
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Processando..." : "Aceitar e Continuar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PlatformTerms() {
  return (
    <div className="space-y-4">
      <p className="font-bold text-gray-900">TERMOS DE USO DA PLATAFORMA BCM TECH DELIVERY</p>
      <p className="text-xs text-gray-500">&Uacute;ltima atualiza&ccedil;&atilde;o: Mar&ccedil;o de 2026</p>

      <p>Estes Termos de Uso, doravante denominados &quot;Termos&quot;, regulam o acesso e o uso da plataforma bcmTech Delivery, doravante denominada &quot;Plataforma&quot;, operada por BCM Tech, doravante denominada &quot;Empresa&quot;, inscrita no CNPJ sob o n&ordm; 59.858.037/0001-06, com sede na Avenida Nossa Senhora da Gra&ccedil;a, 19, Centro, CEP 96330-000, S&atilde;o Gabriel &ndash; RS.</p>

      <p>Ao criar uma conta e utilizar a Plataforma, voc&ecirc;, doravante denominado &quot;Usu&aacute;rio&quot; ou &quot;Vendedor&quot;, declara ter lido, compreendido e concordado integralmente com estes Termos.</p>

      <p className="font-bold text-gray-900">1. OBJETO</p>
      <p>1.1. A Plataforma &eacute; um marketplace que conecta vendedores (estabelecimentos comerciais) a consumidores finais, oferecendo infraestrutura tecnol&oacute;gica para cataloga&ccedil;&atilde;o de produtos, recebimento de pedidos, processamento de pagamentos e log&iacute;stica de entrega.</p>
      <p>1.2. A Empresa atua exclusivamente como intermedi&aacute;ria tecnol&oacute;gica, n&atilde;o sendo parte na rela&ccedil;&atilde;o de consumo entre o Vendedor e o Cliente.</p>

      <p className="font-bold text-gray-900">2. CADASTRO E CONTA</p>
      <p>2.1. O Vendedor declara que todas as informa&ccedil;&otilde;es fornecidas no cadastro s&atilde;o verdadeiras, completas e atualizadas, sob pena de suspens&atilde;o ou cancelamento da conta.</p>
      <p>2.2. O Vendedor &eacute; integralmente respons&aacute;vel pela seguran&ccedil;a de suas credenciais de acesso (login e senha).</p>
      <p>2.3. &Eacute; vedado o cadastro de menores de 18 anos ou pessoas jur&iacute;dicas sem representa&ccedil;&atilde;o legal v&aacute;lida.</p>

      <p className="font-bold text-gray-900">3. RESPONSABILIDADES DO VENDEDOR</p>
      <p>3.1. O Vendedor &eacute; o &uacute;nico e exclusivo respons&aacute;vel por:</p>
      <p className="pl-4">a) A qualidade, seguran&ccedil;a, legalidade e proced&ecirc;ncia dos produtos e servi&ccedil;os anunciados;</p>
      <p className="pl-4">b) O cumprimento de todas as obriga&ccedil;&otilde;es previstas no C&oacute;digo de Defesa do Consumidor (Lei n&ordm; 8.078/1990), incluindo garantias, trocas, devolu&ccedil;&otilde;es e atendimento ao cliente;</p>
      <p className="pl-4">c) O cumprimento das normas sanit&aacute;rias (ANVISA), fiscais, tribut&aacute;rias e regulat&oacute;rias aplic&aacute;veis ao seu ramo de atividade;</p>
      <p className="pl-4">d) A veracidade e precis&atilde;o das informa&ccedil;&otilde;es dos produtos (descri&ccedil;&atilde;o, pre&ccedil;o, imagens, peso, validade);</p>
      <p className="pl-4">e) A emiss&atilde;o de nota fiscal ou cupom fiscal conforme legisla&ccedil;&atilde;o vigente;</p>
      <p className="pl-4">f) O preparo e a disponibiliza&ccedil;&atilde;o dos pedidos dentro do prazo informado;</p>
      <p className="pl-4">g) A resolu&ccedil;&atilde;o de quaisquer disputas, reclama&ccedil;&otilde;es ou a&ccedil;&otilde;es judiciais movidas por clientes.</p>

      <p>3.2. O Vendedor isenta a Empresa de toda e qualquer responsabilidade decorrente de:</p>
      <p className="pl-4">a) Produtos com defeito, avariados, contaminados, fora da validade ou em desacordo com a oferta;</p>
      <p className="pl-4">b) Atrasos, erros ou falhas na entrega causados pelo pr&oacute;prio Vendedor ou por entregadores aut&ocirc;nomos;</p>
      <p className="pl-4">c) Descumprimento de obriga&ccedil;&otilde;es fiscais, trabalhistas ou regulat&oacute;rias;</p>
      <p className="pl-4">d) Danos materiais, morais ou lucros cessantes sofridos por terceiros em raz&atilde;o dos produtos ou servi&ccedil;os do Vendedor.</p>

      <p className="font-bold text-gray-900">4. RESPONSABILIDADES DA EMPRESA</p>
      <p>4.1. A Empresa se compromete a:</p>
      <p className="pl-4">a) Manter a Plataforma dispon&iacute;vel e funcional, ressalvados per&iacute;odos de manuten&ccedil;&atilde;o programada ou eventos de for&ccedil;a maior;</p>
      <p className="pl-4">b) Processar os pagamentos de forma segura atrav&eacute;s de intermediadores autorizados (Mercado Pago);</p>
      <p className="pl-4">c) Repassar os valores devidos ao Vendedor conforme as regras do plano contratado.</p>
      <p>4.2. A Empresa n&atilde;o se responsabiliza por interrup&ccedil;&otilde;es decorrentes de falhas de terceiros, provedores de internet ou eventos de for&ccedil;a maior (art. 393 do C&oacute;digo Civil).</p>

      <p className="font-bold text-gray-900">5. ENTREGADORES AUT&Ocirc;NOMOS</p>
      <p>5.1. Os entregadores que utilizam a Plataforma s&atilde;o profissionais aut&ocirc;nomos, sem qualquer v&iacute;nculo empregat&iacute;cio com a Empresa ou com o Vendedor.</p>
      <p>5.2. A Empresa n&atilde;o se responsabiliza por atos, omiss&otilde;es, atrasos ou danos causados pelos entregadores durante o transporte dos produtos.</p>

      <p className="font-bold text-gray-900">6. PAGAMENTOS E COMISS&Otilde;ES</p>
      <p>6.1. A Empresa cobra comiss&atilde;o sobre o valor dos pedidos conforme o plano contratado pelo Vendedor.</p>
      <p>6.2. Os pagamentos dos clientes s&atilde;o processados pelo Mercado Pago, que atua como intermediador de pagamentos nos termos da legisla&ccedil;&atilde;o vigente.</p>
      <p>6.3. A Empresa n&atilde;o se responsabiliza por estornos (chargebacks) decorrentes de fraudes ou disputas entre o Vendedor e o cliente.</p>

      <p className="font-bold text-gray-900">7. PROPRIEDADE INTELECTUAL</p>
      <p>7.1. Todo o conte&uacute;do da Plataforma (c&oacute;digo-fonte, design, marca, logotipos) &eacute; de propriedade exclusiva da Empresa, protegido pela Lei n&ordm; 9.610/1998 (Direitos Autorais) e pela Lei n&ordm; 9.279/1996 (Propriedade Industrial).</p>
      <p>7.2. O Vendedor concede &agrave; Empresa licen&ccedil;a n&atilde;o exclusiva para exibir seus produtos, logotipo e informa&ccedil;&otilde;es na Plataforma para fins de divulga&ccedil;&atilde;o.</p>

      <p className="font-bold text-gray-900">8. PROTE&Ccedil;&Atilde;O DE DADOS (LGPD)</p>
      <p>8.1. A Empresa trata os dados pessoais dos Usu&aacute;rios em conformidade com a Lei Geral de Prote&ccedil;&atilde;o de Dados (Lei n&ordm; 13.709/2018).</p>
      <p>8.2. Os dados coletados s&atilde;o utilizados exclusivamente para a presta&ccedil;&atilde;o dos servi&ccedil;os da Plataforma, processamento de pagamentos e comunica&ccedil;&otilde;es necess&aacute;rias.</p>
      <p>8.3. O Vendedor se compromete a tratar os dados pessoais de seus clientes em conformidade com a LGPD, sendo respons&aacute;vel por eventuais viola&ccedil;&otilde;es.</p>
      <p>8.4. O Usu&aacute;rio pode exercer seus direitos previstos no art. 18 da LGPD (acesso, corre&ccedil;&atilde;o, elimina&ccedil;&atilde;o, portabilidade) mediante contato pelo e-mail bcmtechdev@gmail.com.</p>

      <p className="font-bold text-gray-900">9. SUSPENS&Atilde;O E CANCELAMENTO</p>
      <p>9.1. A Empresa poder&aacute; suspender ou cancelar a conta do Vendedor, a qualquer tempo e sem aviso pr&eacute;vio, em caso de:</p>
      <p className="pl-4">a) Viola&ccedil;&atilde;o destes Termos;</p>
      <p className="pl-4">b) Pr&aacute;ticas fraudulentas, ilegais ou abusivas;</p>
      <p className="pl-4">c) Reiteradas reclama&ccedil;&otilde;es de clientes;</p>
      <p className="pl-4">d) Inatividade prolongada (superior a 180 dias).</p>
      <p>9.2. O Vendedor pode cancelar sua conta a qualquer momento, desde que n&atilde;o possua pedidos em andamento ou valores pendentes.</p>

      <p className="font-bold text-gray-900">10. LIMITA&Ccedil;&Atilde;O DE RESPONSABILIDADE</p>
      <p>10.1. A responsabilidade da Empresa limita-se aos valores efetivamente recebidos como comiss&atilde;o nos &uacute;ltimos 12 meses, n&atilde;o respondendo por danos indiretos, lucros cessantes ou danos morais.</p>
      <p>10.2. A Empresa n&atilde;o garante resultados comerciais, volume de vendas ou lucratividade ao Vendedor.</p>

      <p className="font-bold text-gray-900">11. DISPOSI&Ccedil;&Otilde;ES GERAIS</p>
      <p>11.1. Estes Termos s&atilde;o regidos pela legisla&ccedil;&atilde;o da Rep&uacute;blica Federativa do Brasil.</p>
      <p>11.2. Fica eleito o foro da comarca de S&atilde;o Gabriel, Estado do Rio Grande do Sul, para dirimir quaisquer controv&eacute;rsias, com ren&uacute;ncia a qualquer outro, por mais privilegiado que seja.</p>
      <p>11.3. A Empresa reserva-se o direito de alterar estes Termos a qualquer tempo, notificando o Usu&aacute;rio por meio da Plataforma. O uso continuado ap&oacute;s a altera&ccedil;&atilde;o implica aceita&ccedil;&atilde;o dos novos Termos.</p>
      <p>11.4. A invalidade ou nulidade de qualquer cl&aacute;usula n&atilde;o prejudica as demais disposi&ccedil;&otilde;es destes Termos.</p>

      <p className="font-bold text-gray-900">12. MARCO CIVIL DA INTERNET</p>
      <p>12.1. A Plataforma opera em conformidade com a Lei n&ordm; 12.965/2014 (Marco Civil da Internet) e o Decreto n&ordm; 8.771/2016, assegurando a neutralidade de rede, a prote&ccedil;&atilde;o dos registros de acesso e a privacidade dos usu&aacute;rios.</p>

      <p className="font-bold text-gray-900">13. COM&Eacute;RCIO ELETR&Ocirc;NICO</p>
      <p>13.1. A Plataforma cumpre as disposi&ccedil;&otilde;es do Decreto n&ordm; 7.962/2013, que regulamenta o com&eacute;rcio eletr&ocirc;nico no Brasil, fornecendo informa&ccedil;&otilde;es claras sobre os servi&ccedil;os, meios de contato e procedimentos para resolu&ccedil;&atilde;o de problemas.</p>

      <p className="mt-6 text-xs text-gray-400 text-center">Ao clicar em &quot;Aceitar e Continuar&quot;, voc&ecirc; manifesta seu consentimento livre, informado e inequ&iacute;voco com todos os termos acima.</p>
    </div>
  );
}

function SubscriptionTerms() {
  return (
    <div className="space-y-4">
      <p className="font-bold text-gray-900">CONTRATO DE ASSINATURA DE PLANO &mdash; BCM TECH DELIVERY</p>
      <p className="text-xs text-gray-500">&Uacute;ltima atualiza&ccedil;&atilde;o: Mar&ccedil;o de 2026</p>

      <p>Este Contrato de Assinatura, doravante denominado &quot;Contrato&quot;, regula a contrata&ccedil;&atilde;o de planos pagos na plataforma bcmTech Delivery, doravante denominada &quot;Plataforma&quot;, operada por BCM Tech, doravante denominada &quot;Empresa&quot;.</p>

      <p className="font-bold text-gray-900">1. OBJETO</p>
      <p>1.1. O presente Contrato tem por objeto a contrata&ccedil;&atilde;o de plano de assinatura que confere ao Vendedor funcionalidades e benef&iacute;cios adicionais na Plataforma, conforme descri&ccedil;&atilde;o de cada plano.</p>
      <p>1.2. Os planos dispon&iacute;veis e seus respectivos benef&iacute;cios est&atilde;o descritos na p&aacute;gina de planos da Plataforma e podem ser atualizados periodicamente.</p>

      <p className="font-bold text-gray-900">2. PER&Iacute;ODOS DE COBRAN&Ccedil;A</p>
      <p>2.1. O Vendedor pode optar pelos seguintes per&iacute;odos de cobran&ccedil;a:</p>
      <p className="pl-4">a) Mensal: cobran&ccedil;a a cada 30 dias;</p>
      <p className="pl-4">b) Trimestral: cobran&ccedil;a a cada 90 dias, com desconto de 10% sobre o valor mensal;</p>
      <p className="pl-4">c) Semestral: cobran&ccedil;a a cada 180 dias, com desconto de 20% sobre o valor mensal;</p>
      <p className="pl-4">d) Anual: cobran&ccedil;a a cada 365 dias, com desconto de 30% sobre o valor mensal.</p>
      <p>2.2. Para per&iacute;odos trimestrais, semestrais e anuais, o Vendedor poder&aacute; parcelar o valor total no cart&atilde;o de cr&eacute;dito em at&eacute; o n&uacute;mero de meses correspondente ao per&iacute;odo (3x, 6x ou 12x, respectivamente), conforme disponibilidade do meio de pagamento.</p>

      <p className="font-bold text-gray-900">3. FORMA DE PAGAMENTO</p>
      <p>3.1. Os pagamentos s&atilde;o processados pelo Mercado Pago, intermediador de pagamentos autorizado pelo Banco Central do Brasil.</p>
      <p>3.2. S&atilde;o aceitos: cart&atilde;o de cr&eacute;dito (&agrave; vista ou parcelado), PIX e boleto banc&aacute;rio, conforme disponibilidade.</p>
      <p>3.3. O Vendedor &eacute; respons&aacute;vel por manter seus dados de pagamento atualizados.</p>

      <p className="font-bold text-gray-900">4. ATIVA&Ccedil;&Atilde;O E VIG&Ecirc;NCIA</p>
      <p>4.1. O plano ser&aacute; ativado imediatamente ap&oacute;s a confirma&ccedil;&atilde;o do pagamento pelo intermediador.</p>
      <p>4.2. A vig&ecirc;ncia do plano corresponde ao per&iacute;odo contratado (1, 3, 6 ou 12 meses), contado a partir da data de ativa&ccedil;&atilde;o.</p>
      <p>4.3. Ao t&eacute;rmino da vig&ecirc;ncia, o plano n&atilde;o ser&aacute; renovado automaticamente. O Vendedor retornar&aacute; ao plano Gratuito at&eacute; que realize nova contrata&ccedil;&atilde;o.</p>

      <p className="font-bold text-gray-900">5. CANCELAMENTO E REEMBOLSO</p>
      <p>5.1. O Vendedor poder&aacute; solicitar o cancelamento do plano a qualquer momento.</p>
      <p>5.2. Em caso de cancelamento dentro de 7 (sete) dias corridos a partir da contrata&ccedil;&atilde;o, o Vendedor ter&aacute; direito ao reembolso integral do valor pago, nos termos do art. 49 do C&oacute;digo de Defesa do Consumidor (direito de arrependimento).</p>
      <p>5.3. Ap&oacute;s o prazo de 7 dias, n&atilde;o haver&aacute; reembolso proporcional. O plano permanecer&aacute; ativo at&eacute; o t&eacute;rmino do per&iacute;odo contratado.</p>
      <p>5.4. A Empresa poder&aacute; cancelar o plano em caso de viola&ccedil;&atilde;o dos Termos de Uso, sem direito a reembolso.</p>

      <p className="font-bold text-gray-900">6. ALTERA&Ccedil;&Atilde;O DE PLANO</p>
      <p>6.1. O Vendedor poder&aacute; fazer upgrade para um plano superior a qualquer momento, sendo cobrada a diferen&ccedil;a proporcional.</p>
      <p>6.2. O downgrade para um plano inferior s&oacute; ser&aacute; efetivado ao t&eacute;rmino do per&iacute;odo vigente.</p>

      <p className="font-bold text-gray-900">7. ALTERA&Ccedil;&Atilde;O DE PRE&Ccedil;OS</p>
      <p>7.1. A Empresa reserva-se o direito de alterar os valores dos planos, notificando o Vendedor com anteced&ecirc;ncia m&iacute;nima de 30 (trinta) dias.</p>
      <p>7.2. As altera&ccedil;&otilde;es de pre&ccedil;o n&atilde;o afetam planos j&aacute; contratados durante sua vig&ecirc;ncia.</p>

      <p className="font-bold text-gray-900">8. OBRIGA&Ccedil;&Otilde;ES FISCAIS</p>
      <p>8.1. A Empresa emitir&aacute; nota fiscal de servi&ccedil;o referente &agrave; assinatura do plano, conforme legisla&ccedil;&atilde;o tribut&aacute;ria vigente.</p>
      <p>8.2. O Vendedor &eacute; respons&aacute;vel por suas pr&oacute;prias obriga&ccedil;&otilde;es fiscais decorrentes de sua atividade comercial.</p>

      <p className="font-bold text-gray-900">9. PROTE&Ccedil;&Atilde;O DE DADOS</p>
      <p>9.1. Os dados de pagamento s&atilde;o processados exclusivamente pelo Mercado Pago e n&atilde;o s&atilde;o armazenados pela Empresa.</p>
      <p>9.2. O tratamento de dados pessoais segue a Pol&iacute;tica de Privacidade e a LGPD (Lei n&ordm; 13.709/2018).</p>

      <p className="font-bold text-gray-900">10. FORO</p>
      <p>10.1. Este Contrato &eacute; regido pela legisla&ccedil;&atilde;o brasileira. Fica eleito o foro da comarca de S&atilde;o Gabriel &ndash; RS para dirimir quaisquer controv&eacute;rsias.</p>

      <p className="mt-6 text-xs text-gray-400 text-center">Ao clicar em &quot;Aceitar e Continuar&quot;, voc&ecirc; manifesta seu consentimento livre, informado e inequ&iacute;voco com todos os termos acima, nos termos do art. 8&ordm; da LGPD e do art. 49 do CDC.</p>
    </div>
  );
}
