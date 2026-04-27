<?php

use Twig\Environment;
use Twig\Error\LoaderError;
use Twig\Error\RuntimeError;
use Twig\Extension\CoreExtension;
use Twig\Extension\SandboxExtension;
use Twig\Markup;
use Twig\Sandbox\SecurityError;
use Twig\Sandbox\SecurityNotAllowedTagError;
use Twig\Sandbox\SecurityNotAllowedFilterError;
use Twig\Sandbox\SecurityNotAllowedFunctionError;
use Twig\Source;
use Twig\Template;

/* sql/profiling_chart.twig */
class __TwigTemplate_d563b6d521ad1b223c5583b1973776ff extends Template
{
    private $source;
    private $macros = [];

    public function __construct(Environment $env)
    {
        parent::__construct($env);

        $this->source = $this->getSourceContext();

        $this->parent = false;

        $this->blocks = [
        ];
    }

    protected function doDisplay(array $context, array $blocks = [])
    {
        $macros = $this->macros;
        // line 1
        yield "<fieldset class=\"pma-fieldset\">
  <legend>";
yield _gettext("Profiling");
        // line 2
        yield "</legend>
  <div class=\"float-start mx-2\">
    <h3>";
yield _gettext("Detailed profile");
        // line 4
        yield "</h3>
    <table class=\"table table-sm table-striped\" id=\"profiletable\">
      <thead>
      <tr>
        <th>
          ";
yield _gettext("Order");
        // line 10
        yield "          <div class=\"sorticon\"></div>
        </th>
        <th>
          ";
yield _gettext("State");
        // line 14
        yield "          <div class=\"sorticon\"></div>
        </th>
        <th>
          ";
yield _gettext("Time");
        // line 18
        yield "          <div class=\"sorticon\"></div>
        </th>
      </tr>
      </thead>
      <tbody>
        ";
        // line 23
        $context['_parent'] = $context;
        $context['_seq'] = CoreExtension::ensureTraversable(CoreExtension::getAttribute($this->env, $this->source, ($context["profiling"] ?? null), "profile", [], "any", false, false, false, 23));
        $context['loop'] = [
          'parent' => $context['_parent'],
          'index0' => 0,
          'index'  => 1,
          'first'  => true,
        ];
        if (is_array($context['_seq']) || (is_object($context['_seq']) && $context['_seq'] instanceof \Countable)) {
            $length = count($context['_seq']);
            $context['loop']['revindex0'] = $length - 1;
            $context['loop']['revindex'] = $length;
            $context['loop']['length'] = $length;
            $context['loop']['last'] = 1 === $length;
        }
        foreach ($context['_seq'] as $context["_key"] => $context["state"]) {
            // line 24
            yield "          <tr>
            <td>";
            // line 25
            yield $this->env->getRuntime('Twig\Runtime\EscaperRuntime')->escape(CoreExtension::getAttribute($this->env, $this->source, $context["loop"], "index", [], "any", false, false, false, 25), "html", null, true);
            yield "</td>
            <td>";
            // line 26
            yield $this->env->getRuntime('Twig\Runtime\EscaperRuntime')->escape(CoreExtension::getAttribute($this->env, $this->source, $context["state"], "status", [], "any", false, false, false, 26), "html", null, true);
            yield "</td>
            <td class=\"text-end\">
              ";
            // line 28
            yield $this->env->getRuntime('Twig\Runtime\EscaperRuntime')->escape(CoreExtension::getAttribute($this->env, $this->source, $context["state"], "duration", [], "any", false, false, false, 28), "html", null, true);
            yield "s
              <span class=\"rawvalue hide\">";
            // line 29
            yield $this->env->getRuntime('Twig\Runtime\EscaperRuntime')->escape(CoreExtension::getAttribute($this->env, $this->source, $context["state"], "duration_raw", [], "any", false, false, false, 29), "html", null, true);
            yield "</span>
            </td>
          </tr>
        ";
            ++$context['loop']['index0'];
            ++$context['loop']['index'];
            $context['loop']['first'] = false;
            if (isset($context['loop']['length'])) {
                --$context['loop']['revindex0'];
                --$context['loop']['revindex'];
                $context['loop']['last'] = 0 === $context['loop']['revindex0'];
            }
        }
        $_parent = $context['_parent'];
        unset($context['_seq'], $context['_iterated'], $context['_key'], $context['state'], $context['_parent'], $context['loop']);
        $context = array_intersect_key($context, $_parent) + $_parent;
        // line 33
        yield "      </tbody>
    </table>
  </div>

  <div class=\"float-start mx-2\">
    <h3>";
yield _gettext("Summary by state");
        // line 38
        yield PhpMyAdmin\Html\MySQLDocumentation::show("general-thread-states");
        yield "</h3>
    <table class=\"table table-sm table-striped\" id=\"profilesummarytable\">
      <thead>
      <tr>
        <th>
          ";
yield _gettext("State");
        // line 44
        yield "          <div class=\"sorticon\"></div>
        </th>
        <th>
          ";
yield _gettext("Total Time");
        // line 48
        yield "          <div class=\"sorticon\"></div>
        </th>
        <th>
          ";
yield _gettext("% Time");
        // line 52
        yield "          <div class=\"sorticon\"></div>
        </th>
        <th>
          ";
yield _gettext("Calls");
        // line 56
        yield "          <div class=\"sorticon\"></div>
        </th>
        <th>
          ";
yield _gettext("ø Time");
        // line 60
        yield "          <div class=\"sorticon\"></div>
        </th>
      </tr>
      </thead>
      <tbody>
        ";
        // line 65
        $context['_parent'] = $context;
        $context['_seq'] = CoreExtension::ensureTraversable(CoreExtension::getAttribute($this->env, $this->source, ($context["profiling"] ?? null), "states", [], "any", false, false, false, 65));
        foreach ($context['_seq'] as $context["name"] => $context["stats"]) {
            // line 66
            yield "          <tr>
            <td>";
            // line 67
            yield $this->env->getRuntime('Twig\Runtime\EscaperRuntime')->escape($context["name"], "html", null, true);
            yield "</td>
            <td class=\"text-end\">
              ";
            // line 69
            yield $this->env->getRuntime('Twig\Runtime\EscaperRuntime')->escape(PhpMyAdmin\Util::formatNumber(CoreExtension::getAttribute($this->env, $this->source, $context["stats"], "total_time", [], "any", false, false, false, 69), 3, 1), "html", null, true);
            yield "s
              <span class=\"rawvalue hide\">";
            // line 70
            yield $this->env->getRuntime('Twig\Runtime\EscaperRuntime')->escape(CoreExtension::getAttribute($this->env, $this->source, $context["stats"], "total_time", [], "any", false, false, false, 70), "html", null, true);
            yield "</span>
            </td>
            <td class=\"text-end\">
              ";
            // line 73
            yield $this->env->getRuntime('Twig\Runtime\EscaperRuntime')->escape(PhpMyAdmin\Util::formatNumber((100 * (CoreExtension::getAttribute($this->env, $this->source, $context["stats"], "total_time", [], "any", false, false, false, 73) / CoreExtension::getAttribute($this->env, $this->source, ($context["profiling"] ?? null), "total_time", [], "any", false, false, false, 73))), 0, 2), "html", null, true);
            yield "%
            </td>
            <td class=\"text-end\">";
            // line 75
            yield $this->env->getRuntime('Twig\Runtime\EscaperRuntime')->escape(CoreExtension::getAttribute($this->env, $this->source, $context["stats"], "calls", [], "any", false, false, false, 75), "html", null, true);
            yield "</td>
            <td class=\"text-end\">
              ";
            // line 77
            yield $this->env->getRuntime('Twig\Runtime\EscaperRuntime')->escape(PhpMyAdmin\Util::formatNumber((CoreExtension::getAttribute($this->env, $this->source, $context["stats"], "total_time", [], "any", false, false, false, 77) / CoreExtension::getAttribute($this->env, $this->source, $context["stats"], "calls", [], "any", false, false, false, 77)), 3, 1), "html", null, true);
            yield "s
              <span class=\"rawvalue hide\">
                ";
            // line 79
            yield $this->env->getRuntime('Twig\Runtime\EscaperRuntime')->escape($this->extensions['Twig\Extension\CoreExtension']->formatNumber((CoreExtension::getAttribute($this->env, $this->source, $context["stats"], "total_time", [], "any", false, false, false, 79) / CoreExtension::getAttribute($this->env, $this->source, $context["stats"], "calls", [], "any", false, false, false, 79)), 8, ".", ""), "html", null, true);
            yield "
              </span>
            </td>
          </tr>
        ";
        }
        $_parent = $context['_parent'];
        unset($context['_seq'], $context['_iterated'], $context['name'], $context['stats'], $context['_parent'], $context['loop']);
        $context = array_intersect_key($context, $_parent) + $_parent;
        // line 84
        yield "      </tbody>
    </table>
  </div>
  <div class='clearfloat'></div>

  <div id=\"profilingChartData\" class=\"hide\">";
        // line 90
        yield $this->env->getRuntime('Twig\Runtime\EscaperRuntime')->escape(json_encode(CoreExtension::getAttribute($this->env, $this->source, ($context["profiling"] ?? null), "chart", [], "any", false, false, false, 90)), "html", null, true);
        // line 91
        yield "</div>
  <div id=\"profilingchart\" class=\"hide\"></div>

  <script type=\"text/javascript\">
    AJAX.registerOnload('sql.js', function () {
      Sql.makeProfilingChart();
      Sql.initProfilingTables();
    });
  </script>
</fieldset>
";
        return; yield '';
    }

    /**
     * @codeCoverageIgnore
     */
    public function getTemplateName()
    {
        return "sql/profiling_chart.twig";
    }

    /**
     * @codeCoverageIgnore
     */
    public function isTraitable()
    {
        return false;
    }

    /**
     * @codeCoverageIgnore
     */
    public function getDebugInfo()
    {
        return array (  230 => 91,  228 => 90,  221 => 84,  210 => 79,  205 => 77,  200 => 75,  195 => 73,  189 => 70,  185 => 69,  180 => 67,  177 => 66,  173 => 65,  166 => 60,  160 => 56,  154 => 52,  148 => 48,  142 => 44,  133 => 38,  125 => 33,  107 => 29,  103 => 28,  98 => 26,  94 => 25,  91 => 24,  74 => 23,  67 => 18,  61 => 14,  55 => 10,  47 => 4,  42 => 2,  38 => 1,);
    }

    public function getSourceContext()
    {
        return new Source("", "sql/profiling_chart.twig", "C:\\Users\\Asus\\Desktop\\Fast_q\\phpMyAdmin-5.2.3-all-languages\\templates\\sql\\profiling_chart.twig");
    }
}
