<?php
/*
  shopee_affiliate.php
  Protótipo completo (single-file) compatível com Shopee BR GraphQL.
  - 4 modos: A (lista geral), B (keyword), C (categoria), D (shop)
  - Configure PARTNER_ID e PARTNER_KEY abaixo
*/

define('PARTNER_ID', 18357430437);
define('PARTNER_KEY', 'WO2WTIS4FVZSJ7JBZBZMVATEDBBEI734');
define('API_URL', 'https://open-api.affiliate.shopee.com.br/graphql');

define('DISABLE_SSL_VERIFY', true);
define('DEBUG', true);

date_default_timezone_set('UTC');

/* ============================================================
   Função: request GraphQL (com assinatura)
   ============================================================ */
function shopee_graphql($query, $variables = []) {
    $timestamp = time();

    $payload = json_encode([
        'query' => $query,
        'variables' => $variables
    ], JSON_UNESCAPED_UNICODE);

    $signature = hash('sha256',
        PARTNER_ID . $timestamp . $payload . PARTNER_KEY
    );

    $headers = [
        'Authorization: SHA256 Credential=' . PARTNER_ID .
        ', Timestamp=' . $timestamp .
        ', Signature=' . $signature,
        'Content-Type: application/json'
    ];

    $ch = curl_init(API_URL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    if (DISABLE_SSL_VERIFY) {
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    }

    $res = curl_exec($ch);
    $err = curl_error($ch);
    $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($res === false) {
        return ['error' => true, 'message' => $err, 'http_code' => $http];
    }

    $json = json_decode($res, true);
    if ($json === null) {
        return ['error' => true, 'message' => 'Invalid JSON', 'raw' => $res];
    }

    return $json;
}

/* ============================================================
   Helpers
   ============================================================ */
function h($v) { return htmlspecialchars($v, ENT_QUOTES, 'UTF-8'); }
function price_format($raw) {
    if (!is_numeric($raw)) return '';
    $v = $raw ;
    return 'R$ ' . number_format($v, 2, ',', '.');
}

/* ============================================================
   GET parameters
   ============================================================ */
$mode = isset($_GET['mode']) ? strtoupper(substr($_GET['mode'],0,1)) : 'A';
$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 20;

$keyword = $_GET['keyword'] ?? '';
$productCatId = isset($_GET['productCatId']) ? intval($_GET['productCatId']) : null;
$shopId = isset($_GET['shopId']) ? intval($_GET['shopId']) : null;
$sortType = isset($_GET['sortType']) ? intval($_GET['sortType']) : null;

$generated_link = null;
$api_error = null;
$debug_raw = null;

/* ============================================================
   Geração de short link (mutation)
   ============================================================ */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['product_url'])) {

    $product_url = filter_var(trim($_POST['product_url']), FILTER_SANITIZE_URL);

    if ($product_url) {

        $mutation = <<<'GQL'
mutation GenerateShort($originUrl:String!, $subIds:[String!]) {
  generateShortLink(input:{
    originUrl: $originUrl,
    subIds: $subIds
  }) {
    shortLink
  }
}
GQL;

        $variables = [
            "originUrl" => $product_url,
            "subIds" => ["s1","s2","s3","s4","s5"]
        ];

        $resp = shopee_graphql($mutation, $variables);
        $debug_raw = $resp;

        if (isset($resp['errors'][0])) {
            $e = $resp['errors'][0];
            $msg = $e['message'] ?? 'Erro';
            $code = $e['extensions']['code'] ?? 'n/a';
            $api_error = "GraphQL error: {$msg} (code: {$code})";
        } elseif (isset($resp['data']['generateShortLink']['shortLink'])) {
            $generated_link = $resp['data']['generateShortLink']['shortLink'];
        } else {
            $api_error = "Resposta inesperada ao gerar shortLink.";
        }

    } else {
        $api_error = "URL inválida.";
    }
}

/* ============================================================
   Query de produtos
   ============================================================ */
$product_fields = <<<GQL
nodes {
  itemId
  productName
  imageUrl
  priceMin
  priceMax
  commissionRate
  offerLink
  productLink
  shopId
  shopName
  commission
  price
}
pageInfo {
  page
  limit
  hasNextPage
}
GQL;

$query = '';
$variables = ['page' => $page, 'limit' => $limit];

switch ($mode) {

    case 'B': // KEYWORD
        $query = <<<GQL
        query ProductOfferByKeyword(\$page:Int!, \$limit:Int!, \$keyword:String, \$sortType:Int) {
          productOfferV2(
            page: \$page,
            limit: \$limit,
            keyword: \$keyword,
            sortType: \$sortType
          ) {
            $product_fields
          }
        }
        GQL;
        
        $variables['keyword'] = $keyword;
        $variables['sortType'] = $sortType; // adiciona sort
        
        break;

    case 'C': // CATEGORY — usando productCatId correto
        if ($productCatId) {
            $query = <<<GQL
query ProductOfferByCategory(\$page:Int!, \$limit:Int!, \$productCatId:Int!) {
  productOfferV2(page: \$page, limit: \$limit, productCatId: \$productCatId) {
    $product_fields
  }
}
GQL;
            $variables['productCatId'] = $productCatId;
        } else {
            $query = null;
            $api_error = "Selecione uma categoria válida.";
        }
        break;

        case 'D': // SHOP
            $shopIdClean = preg_replace('/\D/', '', $shopId);
        
            $query = <<<GQL
        query ProductOfferByShop(\$page:Int!, \$limit:Int!) {
          productOfferV2(
            page: \$page,
            limit: \$limit,
            listType: 5,
            matchId: $shopIdClean
          ) {
            $product_fields
          }
        }
        GQL;

        $variables = [
            'page' => $page,
            'limit' => $limit
        ];
        
        
            break;
        

            case 'A': // GLOBAL
        
                    $query = <<<GQL
                query ProductOfferGlobal(\$page:Int!, \$limit:Int!, \$sortType:Int, \$keyword:String) {
                  productOfferV2(
                    page: \$page,
                    limit: \$limit,
                    sortType: \$sortType,
                    keyword: \$keyword
                  ) {
                    $product_fields
                  }
                }
                GQL;
                
                    // keyword vazio = busca global REAL
                    $variables['keyword'] = "";
                    $variables['sortType'] = $sortType ?: 2; // default: mais vendidos
                    break;
                
                    default:
    
        $query = <<<GQL
query ProductOfferList(\$page:Int!, \$limit:Int!, \$sortType:Int) {
  productOfferV2(page: \$page, limit: \$limit, sortType: \$sortType) {
    $product_fields
  }
}
GQL;
        $variables['sortType'] = $sortType;
        break;
}

// Executa query
$products_resp = shopee_graphql($query, $variables);

$list = [];
$totalCountText = '';

if (isset($products_resp['errors'])) {
    $api_error = 'GraphQL (list) error: ' . json_encode($products_resp['errors']);
} elseif (isset($products_resp['data']['productOfferV2'])) {
    $c = $products_resp['data']['productOfferV2'];

    $list = $c['nodes'] ?? [];
    if (isset($c['pageInfo'])) {
        $pi = $c['pageInfo'];
        $totalCountText = "Página {$pi['page']} • limite {$pi['limit']} • hasNext: " . ($pi['hasNextPage'] ? 'sim' : 'não');
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Shopee Affiliate — Protótipo (4 modos)</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
<?php /* mantém CSS exatamente igual ao seu */ ?>
body{font-family:Arial,Helvetica,sans-serif;background:#f5f6f8;margin:0;padding:18px}
.wrap{max-width:1100px;margin:0 auto}
header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
h1{font-size:20px;margin:0}
.note{color:#666;font-size:13px}
.controls{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px}
.controls form{display:flex;gap:6px;align-items:center}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
.card{background:#fff;padding:12px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
img.prod{width:100%;height:160px;object-fit:cover;border-radius:6px;margin-bottom:8px}
.title{font-size:14px;font-weight:600;margin-bottom:6px}
.price{color:#e53935;font-weight:700;margin-bottom:8px}
.btn{display:inline-block;padding:8px 10px;background:#ff5f00;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;cursor:pointer;border:0}
.small{font-size:13px;color:#444}
.result{background:#fff;padding:12px;border-radius:8px;margin-top:12px}
pre{white-space:pre-wrap;word-wrap:break-word}
.error{color:#b00020}
.footer{margin-top:18px;color:#777;font-size:13px}
.debug{background:#fff;padding:12px;border-radius:6px;margin-top:12px}
label.select{display:flex;gap:6px;align-items:center}
input[type="text"],input[type="number"],select{padding:6px;border-radius:6px;border:1px solid #ddd}
</style>
</head>
<body>
<div class="wrap">

<header>
    <div>
        <h1>Shopee Affiliate — Protótipo (4 modos)</h1>
        <div class="note">A=Geral, B=Keyword, C=Categoria, D=Shop</div>
    </div>
    <div class="note">Partner ID: <?=h(PARTNER_ID)?> | Página: <?=h($page)?> | Limit: <?=h($limit)?></div>
</header>

<?php if ($api_error): ?>
<div class="result error"><strong>Erro:</strong> <?=h($api_error)?></div>
<?php endif; ?>

<?php if ($generated_link): ?>
<div class="result">
    <strong>Link de afiliado gerado:</strong>
    <p><a href="<?=h($generated_link)?>" target="_blank"><?=h($generated_link)?></a></p>
</div>
<?php endif; ?>

<div class="controls">

<form method="get">
    <label class="select">
        <strong>Modo</strong>
        <select name="mode" onchange="this.form.submit()">
            <option value="A" <?=$mode==='A'?'selected':''?>>A — Geral</option>
            <option value="B" <?=$mode==='B'?'selected':''?>>B — Keyword</option>
            <option value="C" <?=$mode==='C'?'selected':''?>>C — Categoria</option>
            <option value="D" <?=$mode==='D'?'selected':''?>>D — Loja</option>
        </select>
    </label>

    <label class="note">Page:
        <input type="number" name="page" value="<?=h($page)?>">
    </label>

    <label class="note">Limit:
        <input type="number" name="limit" value="<?=h($limit)?>">
    </label>

    <?php if ($mode === 'B'): ?>
    <label class="note">Keyword:
        <input type="text" name="keyword" value="<?=h($keyword)?>">
    </label>
    <?php endif; ?>

    <?php if ($mode === 'C'): ?>
<label class="note">Categoria:
    <select name="productCatId">
        <option value="">-- selecione --</option>
        <?php

        // abre JSON usando fopen
        $json_file = __DIR__ . '/shopee_category_list.json';
        $json_data = '';
        if ($fp = fopen($json_file, 'r')) {
            while (!feof($fp)) {
                $json_data .= fread($fp, 8192);
            }
            fclose($fp);
        }

        $data = json_decode($json_data, true);
        $global = $data['data']['global_cats'] ?? [];

        $options = [];

        foreach ($global as $cat) {
            if (empty($cat['path'])) continue;

            $pathNames = [];
            foreach ($cat['path'] as $level) {
                $pathNames[] = $level['category_name'];
            }

            $finalName = $cat['category_name'];

            // remove duplicação: última categoria do path == categoria final
            if (end($pathNames) === $finalName) {
                // nada — já está no path
            } else {
                // adiciona ao final
                $pathNames[] = $finalName;
            }

            $fullPath = implode(' > ', $pathNames);

            $options[] = [
                'id' => $cat['category_id'],
                'name' => $fullPath
            ];
        }

        // ordenar
        usort($options, fn($a, $b) => strcmp($a['name'], $b['name']));

        // imprimir
        foreach ($options as $opt) {
            $sel = ($opt['id'] == $productCatId) ? 'selected' : '';
            echo "<option value=\"{$opt['id']}\" {$sel}>{$opt['name']}</option>";
        }

        ?>
    </select>
</label>
<?php endif; ?>


<?php if ($mode === 'D'): ?>
<label class="note">Shop ID:
    <input type="number" name="shopId" value="<?=h($shopId)?>">
</label>
<?php endif; ?>



<?php if ($mode !== 'D' && $mode !== 'C'): ?>
    <label class="note">SortType:
        <select name="sortType">
            <option value="" <?=$sortType===null?'selected':''?>>default</option>
            <option value="1" <?=$sortType==1?'selected':''?>>RELEVANCE_DESC (1)</option>
            <option value="2" <?=$sortType==2?'selected':''?>>ITEM_SOLD_DESC (2)</option>
            <option value="3" <?=$sortType==3?'selected':''?>>PRICE_DESC (3)</option>
            <option value="4" <?=$sortType==4?'selected':''?>>PRICE_ASC (4)</option>
            <option value="5" <?=$sortType==5?'selected':''?>>COMMISSION_DESC (5)</option>
        </select>
    </label>
<?php endif; ?>


    <button class="btn" type="submit">Aplicar</button>
</form>

<div style="margin-left:auto" class="note">
    SSL verify: <?=DISABLE_SSL_VERIFY?'DESATIVADO':'ATIVADO'?> |
    Debug: <?=DEBUG?'ON':'OFF'?><br>
    <?=h($totalCountText)?>
</div>
</div>

<section>
<h2>Produtos</h2>

<?php
if (!$list) {
    echo '<div class="result">Nenhum produto retornado.</div>';
} else {
    echo '<div class="grid">';
    foreach ($list as $p) {

        $img = $p['imageUrl'] ?? '';
        $name = $p['productName'] ?? '';
        $price = price_format($p['price']);
        $commission_rate = $p['commissionRate'] ?? '';
        $commission = price_format($p['commission']) ?? '';
        $prod_link = $p['productLink'] ?? '';
        if ($prod_link && strpos($prod_link, 'http') !== 0)
            $prod_link = 'https://shopee.com.br' . $prod_link;

        echo '<div class="card">';
        if ($img) echo '<img class="prod" src="'.h($img).'">';
        echo '<div class="title">'.h($name).'</div>';
        if ($price) echo '<div class="price"> '.h($price).'</div>';
        if ($commission) echo '<div class="small">Comissão: '.h($commission).'</div>';
        if ($commission_rate) echo '<div class="small">Taxa de Comissão: '.h($commission_rate * 100).' %</div>';

        echo '<div class="small" style="margin-top:8px">';
        if ($prod_link) {
            echo '<form method="post">';
            echo '<input type="hidden" name="product_url" value="'.h($prod_link).'">';
            echo '<button class="btn">Gerar link de afiliado</button>';
            echo '</form>';
        }
        echo '</div>';

        echo '</div>';
    }
    echo '</div>';
}
?>
</section>

<div class="footer">
Protótipo. Erros comuns: 10010 parsing, 10020 auth, 10030 rate limit.
</div>

</div>
</body>
</html>
